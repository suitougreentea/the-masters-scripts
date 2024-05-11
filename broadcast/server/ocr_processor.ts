import { OcrPlayerStatus } from "../common/type_definition.ts";
import { OcrResult } from "../common/type_definition.ts";

export const createPerPlayerStreams = (): {
  onNext: (data: OcrResult) => void;
  playerStreams: ReadableStream<OcrPlayerStatus>[];
} => {
  const playerStreamSources = [...new Array(8)].map(() => {
    let onNext!: (status: OcrPlayerStatus) => void;
    let cancelled = false;
    const readableStream = new ReadableStream<OcrPlayerStatus>({
      start(controller) {
        onNext = (status) => {
          if (cancelled) return;
          // TODO: diff check
          controller.enqueue(status);
        };
      },
      cancel() {
        cancelled = true;
      },
    });
    return { onNext, readableStream };
  });
  const playerStreams = playerStreamSources.map((e) => e.readableStream);
  const onNext = (data: OcrResult) => {
    data.status.forEach((status, i) => {
      playerStreamSources[i].onNext(status);
    });
  };
  return { onNext, playerStreams };
};

export const createResultCollector = () => {
  let lastData: OcrPlayerStatus | undefined;
  return new TransformStream<OcrPlayerStatus, OcrPlayerStatus>({
    transform(chunk, controller) {
      if (lastData != null) {
        if (lastData.level > 0 && chunk.level == 0) {
          controller.enqueue(lastData);
        }
      }
      lastData = chunk;
    },
  });
};

export const createMergedStream = <T>(
  streams: ReadableStream<T>[],
): ReadableStream<(T | undefined)[]> => {
  let intervalId!: number;
  let dirty = false;
  let currentData: (T | undefined)[] = [...new Array(8)];
  return new ReadableStream<(T | undefined)[]>({
    start(controller) {
      streams.forEach((stream, i) => {
        (async () => {
          for await (const data of stream) {
            currentData = [...currentData];
            currentData[i] = data;
            dirty = true;
          }
        })();
      });
      intervalId = setInterval(() => {
        if (dirty) {
          controller.enqueue(currentData);
          dirty = false;
        }
      }, 0);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });
};
