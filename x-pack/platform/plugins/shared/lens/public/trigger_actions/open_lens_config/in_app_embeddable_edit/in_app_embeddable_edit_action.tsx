/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import type { CoreStart } from '@kbn/core/public';
import { Action } from '@kbn/ui-actions-plugin/public';
import type { LensPluginStartDependencies } from '../../../plugin';
import type { VisualizationMap, DatasourceMap } from '../../../types';
import type { InlineEditLensEmbeddableContext } from './types';

const ACTION_EDIT_LENS_EMBEDDABLE = 'ACTION_EDIT_LENS_EMBEDDABLE';

export class EditLensEmbeddableAction implements Action<InlineEditLensEmbeddableContext> {
  public type = ACTION_EDIT_LENS_EMBEDDABLE;
  public id = ACTION_EDIT_LENS_EMBEDDABLE;
  public order = 50;

  constructor(
    protected readonly core: CoreStart,
    protected readonly getServices: () => Promise<
      LensPluginStartDependencies & {
        visualizationMap: VisualizationMap;
        datasourceMap: DatasourceMap;
      }
    >
  ) {}

  public getDisplayName(): string {
    return i18n.translate('xpack.lens.app.editLensEmbeddableLabel', {
      defaultMessage: 'Edit visualization',
    });
  }

  public getIconType() {
    return 'pencil';
  }

  public async isCompatible({ attributes }: InlineEditLensEmbeddableContext) {
    const { isEmbeddableEditActionCompatible } = await import('../../../async_services');
    return isEmbeddableEditActionCompatible(this.core, attributes);
  }

  public async execute({
    attributes,
    lensEvent,
    container,
    onUpdate,
    onApply,
    onCancel,
  }: InlineEditLensEmbeddableContext) {
    const [{ executeEditEmbeddableAction }, services] = await Promise.all([
      import('../../../async_services'),
      this.getServices(),
    ]);
    if (attributes) {
      executeEditEmbeddableAction({
        core: this.core,
        deps: services,
        attributes,
        lensEvent,
        container,
        onUpdate,
        onApply,
        onCancel,
      });
    }
  }
}
