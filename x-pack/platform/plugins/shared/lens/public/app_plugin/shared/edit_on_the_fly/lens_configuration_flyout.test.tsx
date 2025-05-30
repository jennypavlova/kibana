/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import type { Query, AggregateQuery } from '@kbn/es-query';
import { coreMock } from '@kbn/core/public/mocks';

import { renderWithReduxStore } from '../../../mocks';
import { mockVisualizationMap, mockDatasourceMap, mockDataPlugin } from '../../../mocks';
import type { LensPluginStartDependencies } from '../../../plugin';
import { createMockStartDependencies } from '../../../editor_frame_service/mocks';
import { LensEditConfigurationFlyout } from './lens_configuration_flyout';
import type { EditConfigPanelProps } from './types';
import { TypedLensSerializedState } from '../../../react_embeddable/types';
import * as getApplicationUserMessagesModule from '../../get_application_user_messages';

jest.mock('@kbn/esql-utils', () => {
  return {
    getESQLResults: jest.fn().mockResolvedValue({
      response: {
        columns: [
          {
            name: '@timestamp',
            id: '@timestamp',
            meta: {
              type: 'date',
            },
          },
          {
            name: 'bytes',
            id: 'bytes',
            meta: {
              type: 'number',
            },
          },
          {
            name: 'memory',
            id: 'memory',
            meta: {
              type: 'number',
            },
          },
        ],
        values: [],
      },
    }),
    getIndexPatternFromESQLQuery: jest.fn().mockReturnValue('index1'),
    getESQLAdHocDataview: jest.fn().mockResolvedValue({}),
    formatESQLColumns: jest.fn().mockReturnValue([
      {
        name: '@timestamp',
        id: '@timestamp',
        meta: {
          type: 'date',
        },
      },
      {
        name: 'bytes',
        id: 'bytes',
        meta: {
          type: 'number',
        },
      },
      {
        name: 'memory',
        id: 'memory',
        meta: {
          type: 'number',
        },
      },
    ]),
  };
});

const lensAttributes = {
  title: 'test',
  visualizationType: 'testVis',
  state: {
    datasourceStates: {
      testDatasource: {},
    },
    visualization: {},
    filters: [],
    query: {
      esql: 'from index1 | limit 10',
    },
  },
  filters: [],
  query: {
    esql: 'from index1 | limit 10',
  },
  references: [],
} as unknown as TypedLensSerializedState['attributes'];
const mockStartDependencies =
  createMockStartDependencies() as unknown as LensPluginStartDependencies;

jest.spyOn(getApplicationUserMessagesModule, 'useApplicationUserMessages');

const data = {
  ...mockDataPlugin(),
  query: {
    ...mockDataPlugin().query,
    timefilter: {
      ...mockDataPlugin().query.timefilter,
      timefilter: {
        ...mockDataPlugin().query.timefilter.timefilter,
        getTime: jest.fn(() => ({
          from: 'now-2m',
          to: 'now',
        })),
        getAbsoluteTime: jest.fn(() => ({
          from: '2021-01-10T04:00:00.000Z',
          to: '2021-01-10T04:00:00.000Z',
        })),
      },
    },
  },
};
const startDependencies = {
  ...mockStartDependencies,
  data,
};
const datasourceMap = mockDatasourceMap();
const visualizationMap = mockVisualizationMap();

describe('LensEditConfigurationFlyout', () => {
  async function renderConfigFlyout(
    propsOverrides: Partial<EditConfigPanelProps> = {},
    query?: Query | AggregateQuery
  ) {
    const { container, ...rest } = renderWithReduxStore(
      <LensEditConfigurationFlyout
        attributes={lensAttributes}
        updatePanelState={jest.fn()}
        coreStart={coreMock.createStart()}
        startDependencies={startDependencies}
        datasourceMap={datasourceMap}
        visualizationMap={visualizationMap}
        closeFlyout={jest.fn()}
        datasourceId={'testDatasource' as EditConfigPanelProps['datasourceId']}
        onApply={jest.fn()}
        onCancel={jest.fn()}
        {...propsOverrides}
      />,
      {},
      {
        preloadedState: {
          datasourceStates: {
            testDatasource: {
              isLoading: false,
              state: 'state',
            },
          },
          activeDatasourceId: 'testDatasource',
          query: query as Query,
        },
      }
    );
    await waitFor(() => container.querySelector('lnsEditFlyoutBody'));
    return { container, ...rest };
  }

  it('should display the header and the link to editor if necessary props are given', async () => {
    const navigateToLensEditorSpy = jest.fn();
    await renderConfigFlyout({
      displayFlyoutHeader: true,
      navigateToLensEditor: navigateToLensEditorSpy,
    });
    expect(screen.getByTestId('editFlyoutHeader')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('navigateToLensEditorLink'));
    expect(navigateToLensEditorSpy).toHaveBeenCalled();
  });

  it('should display the header title correctly for a newly created panel', async () => {
    await renderConfigFlyout({
      displayFlyoutHeader: true,
      isNewPanel: true,
    });
    expect(screen.getByTestId('inlineEditingFlyoutLabel').textContent).toBe('Configuration');
  });

  it('should call the closeFlyout callback if cancel button is clicked', async () => {
    const closeFlyoutSpy = jest.fn();

    await renderConfigFlyout({
      closeFlyout: closeFlyoutSpy,
    });
    expect(screen.getByTestId('lns-layerPanel-0')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('cancelFlyoutButton'));
    expect(closeFlyoutSpy).toHaveBeenCalled();
  });

  it('should call the updatePanelState callback if cancel button is clicked', async () => {
    const updatePanelStateSpy = jest.fn();
    await renderConfigFlyout({
      updatePanelState: updatePanelStateSpy,
    });
    expect(screen.getByTestId('lns-layerPanel-0')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('cancelFlyoutButton'));
    expect(updatePanelStateSpy).toHaveBeenCalled();
  });

  it('should call the updateByRefInput callback if cancel button is clicked and savedObjectId exists', async () => {
    const updateByRefInputSpy = jest.fn();

    await renderConfigFlyout({
      closeFlyout: jest.fn(),
      updateByRefInput: updateByRefInputSpy,
      savedObjectId: 'id',
    });
    await userEvent.click(screen.getByTestId('cancelFlyoutButton'));
    expect(updateByRefInputSpy).toHaveBeenCalled();
  });

  it('should call the saveByRef callback if apply button is clicked and savedObjectId exists', async () => {
    const updateByRefInputSpy = jest.fn();
    const saveByRefSpy = jest.fn();

    await renderConfigFlyout({
      closeFlyout: jest.fn(),
      updateByRefInput: updateByRefInputSpy,
      savedObjectId: 'id',
      saveByRef: saveByRefSpy,
    });
    await userEvent.click(screen.getByTestId('applyFlyoutButton'));
    expect(updateByRefInputSpy).toHaveBeenCalled();
    expect(saveByRefSpy).toHaveBeenCalled();
  });

  it('should call the onApplyCb callback if apply button is clicked', async () => {
    const onApplyCbSpy = jest.fn();

    await renderConfigFlyout(
      {
        closeFlyout: jest.fn(),
        onApply: onApplyCbSpy,
      },
      { esql: 'from index1 | limit 10' }
    );
    await userEvent.click(screen.getByTestId('applyFlyoutButton'));
    expect(onApplyCbSpy).toHaveBeenCalledWith({
      title: 'test',
      visualizationType: 'testVis',
      state: {
        datasourceStates: { testDatasource: 'state' },
        visualization: {},
        filters: [],
        query: { esql: 'from index1 | limit 10' },
      },
      filters: [],
      query: { esql: 'from index1 | limit 10' },
      references: [],
    });
  });

  it('should not display the editor if canEditTextBasedQuery prop is false', async () => {
    await renderConfigFlyout({
      canEditTextBasedQuery: false,
    });
    expect(screen.queryByTestId('ESQLEditor')).toBeNull();
  });

  it('should not display the editor if canEditTextBasedQuery prop is true but the query is not text based', async () => {
    await renderConfigFlyout({
      canEditTextBasedQuery: true,
      attributes: {
        ...lensAttributes,
        state: {
          ...lensAttributes.state,
          query: {
            type: 'kql',
            query: '',
          } as unknown as Query,
        },
      },
    });
    expect(screen.queryByTestId('ESQLEditor')).toBeNull();
  });

  it('should not display the suggestions if hidesSuggestions prop is true', async () => {
    await renderConfigFlyout({
      hidesSuggestions: true,
    });
    expect(screen.queryByTestId('InlineEditingSuggestions')).toBeNull();
  });

  it('should display the suggestions if canEditTextBasedQuery prop is true', async () => {
    await renderConfigFlyout(
      {
        canEditTextBasedQuery: true,
      },
      {
        esql: 'from index1 | limit 10',
      }
    );
    expect(screen.getByTestId('InlineEditingESQLEditor')).toBeInTheDocument();
    expect(screen.getByTestId('InlineEditingSuggestions')).toBeInTheDocument();
  });

  it('should display the ES|QL results table if canEditTextBasedQuery prop is true', async () => {
    await renderConfigFlyout({
      canEditTextBasedQuery: true,
    });
    await waitFor(() => expect(screen.getByTestId('ESQLQueryResults')).toBeInTheDocument());
  });

  it('save button is disabled if no changes have been made', async () => {
    const updateByRefInputSpy = jest.fn();
    const saveByRefSpy = jest.fn();
    const newProps = {
      closeFlyout: jest.fn(),
      updateByRefInput: updateByRefInputSpy,
      savedObjectId: 'id',
      saveByRef: saveByRefSpy,
      attributes: lensAttributes,
    };
    // todo: replace testDatasource with formBased or textBased as it's the only ones accepted
    // @ts-ignore
    newProps.attributes.state.datasourceStates.testDatasource = 'state';
    await renderConfigFlyout(newProps);
    expect(screen.getByRole('button', { name: /apply and close/i })).toBeDisabled();
  });

  it('save button should be disabled if expression cannot be generated', async () => {
    const updateByRefInputSpy = jest.fn();
    const saveByRefSpy = jest.fn();
    const newProps = {
      closeFlyout: jest.fn(),
      updateByRefInput: updateByRefInputSpy,
      savedObjectId: 'id',
      saveByRef: saveByRefSpy,
      datasourceMap: {
        ...datasourceMap,
        testDatasource: {
          ...datasourceMap.testDatasource,
          toExpression: jest.fn(() => null),
        },
      },
    };

    await renderConfigFlyout(newProps);
    expect(screen.getByRole('button', { name: /apply and close/i })).toBeDisabled();
  });

  it('should use correct activeVisualization', async () => {
    const visualizationType = 'testVis';

    await renderConfigFlyout({
      attributes: {
        ...lensAttributes,
        visualizationType,
      },
    });

    expect(getApplicationUserMessagesModule.useApplicationUserMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        visualizationType,
      })
    );
  });
});
