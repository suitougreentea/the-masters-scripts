import { register } from "./inject.ts";
import {
  FileSerializerManager,
  injectKey as serializerManagerKey,
} from "./serializer.ts";
import { injectKey as playersStoreKey, PlayersStore } from "./players_store.ts";
import { injectKey as setupStoreKey, SetupStore } from "./setup_store.ts";
import {
  CompetitionStore,
  injectKey as competitionStoreKey,
} from "./competition_store.ts";
import { injectKey as exporterKey, Exporter } from "./exporter.ts";
import { injectKey as exporterBackendKey, JsonExporterBackend, SpreadsheetExporterBackend } from "./exporter_backend.ts";

export const configureInject = () => {
  register(serializerManagerKey, FileSerializerManager);
  register(playersStoreKey, PlayersStore);
  register(setupStoreKey, SetupStore);
  register(competitionStoreKey, CompetitionStore);
  register(exporterKey, Exporter);
  register(exporterBackendKey, SpreadsheetExporterBackend);
};

export const modifyInjectLocal = () => {
  register(exporterBackendKey, JsonExporterBackend);
}