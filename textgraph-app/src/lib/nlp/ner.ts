import { pipeline, Pipeline } from '@xenova/transformers';

// Define and export a more specific type for the progress callback
export type ProgressCallbackParams = { // Renamed for clarity as it's the parameter type
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
  status?: string;
  name?: string;
};
export type ProgressCallback = (progress: ProgressCallbackParams) => void;

// Define a class to cache the pipeline
class NerPipeline {
  private static instance: Pipeline | null = null;
  private static task: string = 'token-classification';
  private static model: string = 'Xenova/bert-base-multilingual-cased-ner-hrl';

  static async getInstance(progress_callback?: ProgressCallback) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

export interface NerResult {
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

export async function extractEntities(text: string, progress_callback?: ProgressCallback): Promise<NerResult[]> {
  const ner = await NerPipeline.getInstance(progress_callback);
  const results = await ner(text, {
    aggregation_strategy: 'simple',
  });

  return Array.isArray(results) ? results as NerResult[] : [];
}
