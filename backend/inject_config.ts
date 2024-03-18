import { register } from "./inject.ts";
import {
  FileSerializerManager,
  injectKey as serializerManagerKey,
} from "./serializer.ts";
import { InMemorySerializerManager } from "./serializer_dev.ts";
import { injectKey as playersStoreKey, PlayersStore } from "./players_store.ts";
import { injectKey as setupStoreKey, SetupStore } from "./setup_store.ts";
import {
  CompetitionStore,
  injectKey as competitionStoreKey,
} from "./competition_store.ts";
import { Exporter, injectKey as exporterKey } from "./exporter.ts";
import {
  injectKey as exporterBackendKey,
  SpreadsheetExporterBackend,
} from "./exporter_backend.ts";
import { InMemoryExporterBackend } from "./exporter_backend_dev.ts";

export const configureInject = () => {
  register(serializerManagerKey, FileSerializerManager);
  register(playersStoreKey, PlayersStore);
  register(setupStoreKey, SetupStore);
  register(competitionStoreKey, CompetitionStore);
  register(exporterKey, Exporter);
  register(exporterBackendKey, SpreadsheetExporterBackend);
};

export const modifyInjectInMemory = () => {
  register(serializerManagerKey, InMemorySerializerManager);
  register(exporterBackendKey, InMemoryExporterBackend);
};

export const modifyInjectLocal = () => {
  register(exporterBackendKey, InMemoryExporterBackend);
};
