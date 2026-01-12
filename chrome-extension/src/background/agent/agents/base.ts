import type { z } from 'zod';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AgentContext, AgentOutput } from '../types';
import type { BasePrompt } from '../prompts/base';
import type { BaseMessage } from '@langchain/core/messages';
import { createLogger } from '@src/background/log';
import type { Action } from '../actions/builder';
import { convertInputMessages, extractJsonFromModelOutput, removeThinkTags } from '../messages/utils';
import { isAbortedError, ResponseParseError } from './errors';
import { ProviderTypeEnum } from '@extension/storage';

const logger = createLogger('agent');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallOptions = Record<string, any>;

// Update options to use Zod schema
export interface BaseAgentOptions {
  chatLLM: BaseChatModel;
  context: AgentContext;
  prompt: BasePrompt;
  provider?: string;
}
export interface ExtraAgentOptions {
  id?: string;
  toolCallingMethod?: string;
  callOptions?: CallOptions;
}

/**
 * Base class for all agents
 * @param T - The Zod schema for the model output
 * @param M - The type of the result field of the agent output
 */
export abstract class BaseAgent<T extends z.ZodType, M = unknown> {
  protected id: string;
  protected chatLLM: BaseChatModel;
  protected prompt: BasePrompt;
  protected context: AgentContext;
  protected actions: Record<string, Action> = {};
  protected modelOutputSchema: T;
  protected toolCallingMethod: string | null;
  protected chatModelLibrary: string;
  protected modelName: string;
  protected provider: string;
  protected withStructuredOutput: boolean;
  protected callOptions?: CallOptions;
  protected modelOutputToolName: string;
  declare ModelOutput: z.infer<T>;

  constructor(modelOutputSchema: T, options: BaseAgentOptions, extraOptions?: Partial<ExtraAgentOptions>) {
    // base options
    this.modelOutputSchema = modelOutputSchema;
    this.chatLLM = options.chatLLM;
    this.prompt = options.prompt;
    this.context = options.context;
    this.provider = options.provider || '';
    // TODO: fix this, the name is not correct in production environment
    this.chatModelLibrary = this.chatLLM.constructor.name;
    this.modelName = this.getModelName();
    this.withStructuredOutput = this.setWithStructuredOutput();
    // extra options
    this.id = extraOptions?.id || 'agent';
    this.toolCallingMethod = this.setToolCallingMethod(extraOptions?.toolCallingMethod);
    this.callOptions = extraOptions?.callOptions;
    this.modelOutputToolName = `${this.id}_output`;
  }

  // Set the model name
  private getModelName(): string {
    if ('modelName' in this.chatLLM) {
      return this.chatLLM.modelName as string;
    }
    if ('model_name' in this.chatLLM) {
      return this.chatLLM.model_name as string;
    }
    if ('model' in this.chatLLM) {
      return this.chatLLM.model as string;
    }
    return 'Unknown';
  }

  // Set the tool calling method
  private setToolCallingMethod(toolCallingMethod?: string): string | null {
    if (toolCallingMethod === 'auto') {
      switch (this.chatModelLibrary) {
        case 'ChatGoogleGenerativeAI':
          return null;
        case 'ChatOpenAI':
        case 'AzureChatOpenAI':
        case 'ChatGroq':
        case 'ChatXAI':
          return 'function_calling';
        default:
          return null;
      }
    }
    return toolCallingMethod || null;
  }

  // Check if model is a Llama model (only for Llama-specific handling)
  private isLlamaModel(modelName: string): boolean {
    return modelName.includes('Llama-4') || modelName.includes('Llama-3.3') || modelName.includes('llama-3.3');
  }

  /**
   * Check if the current model supports vision/image inputs
   * Models that don't support vision will have images stripped from messages
   */
  protected supportsVision(): boolean {
    const modelNameLower = this.modelName.toLowerCase();

    // Gemini models - only specific models support vision
    if (this.provider === ProviderTypeEnum.Gemini || this.chatModelLibrary === 'ChatGoogleGenerativeAI') {
      // Preview models typically don't support vision
      if (modelNameLower.includes('preview')) {
        logger.debug(`[${this.modelName}] Gemini preview model does not support vision`);
        return false;
      }
      // Flash models with version 2.0+ support vision
      if (modelNameLower.includes('flash') && modelNameLower.includes('2.')) {
        return true;
      }
      // Pro models with version 2.0+ support vision
      if (modelNameLower.includes('pro') && modelNameLower.includes('2.')) {
        return true;
      }
      // Default for Gemini: assume no vision for safety
      logger.debug(`[${this.modelName}] Gemini model vision support unclear, defaulting to no vision`);
      return false;
    }

    // Most OpenAI models support vision (gpt-4o, gpt-4-turbo, etc.)
    if (this.provider === ProviderTypeEnum.OpenAI || this.chatModelLibrary === 'ChatOpenAI') {
      // GPT-4o and newer support vision
      if (modelNameLower.includes('gpt-4o') || modelNameLower.includes('gpt-5')) {
        return true;
      }
      // GPT-4 Vision models
      if (modelNameLower.includes('vision')) {
        return true;
      }
      // GPT-4 Turbo models support vision
      if (modelNameLower.includes('gpt-4-turbo')) {
        return true;
      }
      // Default: older models don't support vision
      return false;
    }

    // Claude models with vision support
    if (this.provider === ProviderTypeEnum.Anthropic || this.chatModelLibrary === 'ChatAnthropic') {
      // Claude 3+ models support vision
      if (modelNameLower.includes('claude-3') || modelNameLower.includes('claude-4')) {
        return true;
      }
      return false;
    }

    // Llama models generally don't support vision in the API
    if (this.provider === ProviderTypeEnum.Llama || this.isLlamaModel(this.modelName)) {
      return false;
    }

    // DeepSeek models generally don't support vision
    if (this.provider === ProviderTypeEnum.DeepSeek) {
      return false;
    }

    // For other providers, default to no vision support for safety
    logger.debug(`[${this.modelName}] Vision support unknown for provider ${this.provider}, defaulting to no vision`);
    return false;
  }

  // Set whether to use structured output based on the model name
  private setWithStructuredOutput(): boolean {
    if (this.modelName === 'deepseek-reasoner' || this.modelName === 'deepseek-r1') {
      return false;
    }

    // Llama API models don't support json_schema response format
    if (this.provider === ProviderTypeEnum.Llama || this.isLlamaModel(this.modelName)) {
      logger.debug(`[${this.modelName}] Llama API doesn't support structured output, using manual JSON extraction`);
      return false;
    }

    return true;
  }

  async invoke(inputMessages: BaseMessage[]): Promise<this['ModelOutput']> {
    // Strip images from messages if model doesn't support vision
    const processedMessages = this.stripImagesFromMessages(inputMessages);

    // Use structured output
    if (this.withStructuredOutput) {
      logger.debug(`[${this.modelName}] Preparing structured output call with schema:`, {
        schemaName: this.modelOutputToolName,
        messageCount: processedMessages.length,
        modelProvider: this.provider,
      });

      const structuredLlm = this.chatLLM.withStructuredOutput(this.modelOutputSchema, {
        includeRaw: true,
        name: this.modelOutputToolName,
      });

      let response = undefined;
      try {
        logger.debug(`[${this.modelName}] Invoking LLM with structured output...`);
        response = await structuredLlm.invoke(processedMessages, {
          signal: this.context.controller.signal,
          ...this.callOptions,
        });

        logger.debug(`[${this.modelName}] LLM response received:`, {
          hasParsed: !!response.parsed,
          hasRaw: !!response.raw,
          rawContent: response.raw?.content?.slice(0, 500) + (response.raw?.content?.length > 500 ? '...' : ''),
        });

        if (response.parsed) {
          logger.debug(`[${this.modelName}] Successfully parsed structured output`);
          return response.parsed;
        }
        logger.error('Failed to parse response', response);
        throw new Error('Could not parse response with structured output');
      } catch (error) {
        if (isAbortedError(error)) {
          throw error;
        }

        // Try to extract JSON from raw response manually if possible
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('is not valid JSON') &&
          response?.raw?.content &&
          typeof response.raw.content === 'string'
        ) {
          const parsed = this.manuallyParseResponse(response.raw.content);
          if (parsed) {
            return parsed;
          }
        }
        logger.error(`[${this.modelName}] LLM call failed with error: \n${errorMessage}`);
        throw new Error(`Failed to invoke ${this.modelName} with structured output: \n${errorMessage}`);
      }
    }

    // Fallback: Without structured output support, need to extract JSON from model output manually
    logger.debug(`[${this.modelName}] Using manual JSON extraction fallback method`);
    const convertedInputMessages = convertInputMessages(processedMessages, this.modelName);

    try {
      const response = await this.chatLLM.invoke(convertedInputMessages, {
        signal: this.context.controller.signal,
        ...this.callOptions,
      });

      if (typeof response.content === 'string') {
        const parsed = this.manuallyParseResponse(response.content);
        if (parsed) {
          return parsed;
        }
      }
    } catch (error) {
      logger.error(`[${this.modelName}] LLM call failed in manual extraction mode:`, error);
      throw error;
    }
    const errorMessage = `Failed to parse response from ${this.modelName}`;
    logger.error(errorMessage);
    throw new ResponseParseError('Could not parse response');
  }

  // Execute the agent and return the result
  abstract execute(): Promise<AgentOutput<M>>;

  // Helper method to validate metadata
  protected validateModelOutput(data: unknown): this['ModelOutput'] | undefined {
    if (!this.modelOutputSchema || !data) return undefined;
    try {
      return this.modelOutputSchema.parse(data);
    } catch (error) {
      logger.error('validateModelOutput', error);
      throw new ResponseParseError('Could not validate model output');
    }
  }

  // Helper method to manually parse the response content
  protected manuallyParseResponse(content: string): this['ModelOutput'] | undefined {
    const cleanedContent = removeThinkTags(content);
    try {
      const extractedJson = extractJsonFromModelOutput(cleanedContent);
      return this.validateModelOutput(extractedJson);
    } catch (error) {
      logger.warning('manuallyParseResponse failed', error);
      return undefined;
    }
  }

  /**
   * Strip images from messages for models that don't support vision
   * Converts image messages to text-only messages
   */
  protected stripImagesFromMessages(messages: BaseMessage[]): BaseMessage[] {
    if (this.supportsVision()) {
      return messages;
    }

    logger.debug(`[${this.modelName}] Stripping images from messages - model does not support vision`);

    return messages.map(message => {
      // Check if message has array content (which may include images)
      if (Array.isArray(message.content)) {
        // Filter out image_url content, keep only text
        const textContent = message.content
          .filter(item => item.type === 'text')
          .map(item => ('text' in item ? item.text : ''))
          .join('\n');

        // Return a new message with text-only content
        return new message.constructor({
          ...message,
          content: textContent,
        }) as BaseMessage;
      }

      // If content is not an array, return message as-is
      return message;
    });
  }
}
