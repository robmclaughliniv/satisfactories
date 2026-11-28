import { z } from 'zod';
import type { CommandName } from '../names';
import {
  CreateWorldPayloadSchema,
  RenameWorldPayloadSchema,
  LinkSavePayloadSchema,
  DeleteWorldPayloadSchema,
} from './world';
import {
  CreateFactoryPayloadSchema,
  UpdateFactoryMetaPayloadSchema,
  DrawFactoryShapePayloadSchema,
  EditFactoryShapePayloadSchema,
  ClearFactoryShapePayloadSchema,
  SetFloorSettingsPayloadSchema,
  DeleteFactoryPayloadSchema,
} from './factory';
import {
  IncludeMachinePayloadSchema,
  ExcludeMachinePayloadSchema,
  ClearMachineOverridePayloadSchema,
} from './membership';
import {
  ConfirmLinePayloadSchema,
  RenameLinePayloadSchema,
  SplitLinePayloadSchema,
  MergeLinesPayloadSchema,
  AssignMachineToLinePayloadSchema,
  RemoveMachineFromLinePayloadSchema,
  ArchiveLinePayloadSchema,
} from './lines';
import {
  ConfirmLinkPayloadSchema,
  RejectLinkPayloadSchema,
  SetLinkRateOverridePayloadSchema,
} from './links';
import { SetStorageRolePayloadSchema } from './storage';
import { DismissAuditItemPayloadSchema, UndismissAuditItemPayloadSchema } from './audit';
import { SaveDraftPayloadSchema, RestoreDraftPayloadSchema, DeleteDraftPayloadSchema } from './drafts';
import { ToggleFavoriteItemPayloadSchema, ToggleFavoriteFactoryPayloadSchema } from './favorites';
import { LegacyMutationPayloadSchema } from './legacy';

export const COMMAND_PAYLOAD_SCHEMAS: Record<CommandName, z.ZodType> = {
  createWorld: CreateWorldPayloadSchema,
  renameWorld: RenameWorldPayloadSchema,
  linkSave: LinkSavePayloadSchema,
  deleteWorld: DeleteWorldPayloadSchema,
  createFactory: CreateFactoryPayloadSchema,
  updateFactoryMeta: UpdateFactoryMetaPayloadSchema,
  drawFactoryShape: DrawFactoryShapePayloadSchema,
  editFactoryShape: EditFactoryShapePayloadSchema,
  clearFactoryShape: ClearFactoryShapePayloadSchema,
  setFloorSettings: SetFloorSettingsPayloadSchema,
  deleteFactory: DeleteFactoryPayloadSchema,
  includeMachine: IncludeMachinePayloadSchema,
  excludeMachine: ExcludeMachinePayloadSchema,
  clearMachineOverride: ClearMachineOverridePayloadSchema,
  confirmLine: ConfirmLinePayloadSchema,
  renameLine: RenameLinePayloadSchema,
  splitLine: SplitLinePayloadSchema,
  mergeLines: MergeLinesPayloadSchema,
  assignMachineToLine: AssignMachineToLinePayloadSchema,
  removeMachineFromLine: RemoveMachineFromLinePayloadSchema,
  archiveLine: ArchiveLinePayloadSchema,
  confirmLink: ConfirmLinkPayloadSchema,
  rejectLink: RejectLinkPayloadSchema,
  setLinkRateOverride: SetLinkRateOverridePayloadSchema,
  setStorageRole: SetStorageRolePayloadSchema,
  dismissAuditItem: DismissAuditItemPayloadSchema,
  undismissAuditItem: UndismissAuditItemPayloadSchema,
  saveDraft: SaveDraftPayloadSchema,
  restoreDraft: RestoreDraftPayloadSchema,
  deleteDraft: DeleteDraftPayloadSchema,
  toggleFavoriteItem: ToggleFavoriteItemPayloadSchema,
  toggleFavoriteFactory: ToggleFavoriteFactoryPayloadSchema,
  legacyMutation: LegacyMutationPayloadSchema,
};