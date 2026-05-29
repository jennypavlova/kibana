/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiLink,
  EuiSkeletonText,
  EuiSwitch,
  EuiText,
  EuiTitle,
  htmlIdGenerator,
} from '@elastic/eui';
import type { EuiButtonGroupOptionProps, EuiComboBoxOptionOption } from '@elastic/eui';
import React, { useCallback, useMemo, useState } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { SERVICE_NAME, SERVICE_ENVIRONMENT } from '@kbn/apm-types';
import type { AlertStatus } from '@kbn/rule-data-utils';
import type { ML_ANOMALY_SEVERITY } from '@kbn/ml-anomaly-utils/anomaly_severity';
import type { Query, TimeRange } from '@kbn/es-query';
import datemath from '@kbn/datemath';
import {
  ENVIRONMENT_ALL,
  ENVIRONMENT_NOT_DEFINED,
  getEnvironmentLabel,
} from '../../../common/environment_filter_values';
import type { Environment } from '../../../common/environment_rt';
import type { SloStatus } from '../../../common/service_inventory';
import type { ServiceMapEmbeddableState } from '../../../server/lib/embeddables/service_map_embeddable_schema';
import type { ConnectionFilter } from '../../components/app/service_map/apply_service_map_visibility';
import {
  ALERT_STATUS_OPTIONS,
  ANOMALY_SEVERITY_OPTIONS,
  CONNECTION_FILTER_OPTIONS,
  SLO_STATUS_OPTIONS,
} from '../../components/app/service_map/service_map_options_panel';
import type { ServiceMapOrientation } from '../../components/app/service_map/service_map_options_panel';
import type { EmbeddableDeps } from '../types';
import { useSuggestions } from './use_suggestions';
import { useAdHocApmDataView } from '../../hooks/use_adhoc_apm_data_view';

interface KueryInputProps {
  kuery: string;
  onChange: (kuery: string) => void;
  deps: EmbeddableDeps;
}

function KueryInput({ kuery, onChange, deps }: KueryInputProps) {
  const { QueryStringInput } = deps.pluginsStart.kql;
  const { dataView } = useAdHocApmDataView();
  const isLoading = !dataView;

  const query: Query = useMemo(() => ({ query: kuery, language: 'kuery' }), [kuery]);

  const handleChange = useCallback(
    (newQuery: Query) => {
      onChange(String(newQuery.query));
    },
    [onChange]
  );

  const kqlDocsUrl = deps.coreStart.docLinks.links.query.kueryQuerySyntax;

  const helpText = (
    <>
      {i18n.translate('xpack.apm.serviceMapEditor.kueryHelpText', {
        defaultMessage: 'Additional filter using KQL syntax.',
      })}{' '}
      <EuiLink
        data-test-subj="apmKueryInputLearnMoreLink"
        href={kqlDocsUrl}
        target="_blank"
        external
      >
        {i18n.translate('xpack.apm.serviceMapEditor.kueryHelpLink', {
          defaultMessage: 'Learn more',
        })}
      </EuiLink>
    </>
  );

  if (isLoading) {
    return (
      <EuiFormRow
        label={i18n.translate('xpack.apm.serviceMapEditor.kueryLabel', {
          defaultMessage: 'KQL filter (optional)',
        })}
        helpText={helpText}
        fullWidth
      >
        <EuiSkeletonText lines={1} />
      </EuiFormRow>
    );
  }

  return (
    <EuiFormRow
      label={i18n.translate('xpack.apm.serviceMapEditor.kueryLabel', {
        defaultMessage: 'KQL filter (optional)',
      })}
      helpText={helpText}
      fullWidth
    >
      <QueryStringInput
        appName="apm"
        indexPatterns={dataView ? [dataView] : []}
        query={query}
        onChange={handleChange}
        onSubmit={handleChange}
        placeholder={i18n.translate('xpack.apm.serviceMapEditor.kueryPlaceholder', {
          defaultMessage: 'Filter service map using KQL syntax',
        })}
        disableLanguageSwitcher
        autoSubmit
        dataTestSubj="apmServiceMapEditorKueryInput"
      />
    </EuiFormRow>
  );
}

interface FilterComboBoxProps<T extends string> {
  label: string;
  placeholder: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: T[];
  onChange: (next: T[]) => void;
  dataTestSubj: string;
}

/** Static multi-select for a single persisted map filter. No live counts — the flyout has no map data. */
function FilterComboBox<T extends string>({
  label,
  placeholder,
  options,
  selected,
  onChange,
  dataTestSubj,
}: FilterComboBoxProps<T>) {
  const comboOptions = useMemo<Array<EuiComboBoxOptionOption<T>>>(
    () => options.map((opt) => ({ label: opt.label, value: opt.value })),
    [options]
  );
  const selectedOptions = useMemo<Array<EuiComboBoxOptionOption<T>>>(
    () =>
      selected.map((value) => {
        const opt = options.find((o) => o.value === value);
        return { label: opt?.label ?? value, value };
      }),
    [options, selected]
  );

  return (
    <EuiFormRow label={label} fullWidth>
      <EuiComboBox
        aria-label={label}
        placeholder={placeholder}
        options={comboOptions}
        selectedOptions={selectedOptions}
        onChange={(changed) => onChange(changed.map((s) => (s.value ?? s.label) as T))}
        fullWidth
        compressed
        isClearable
        data-test-subj={dataTestSubj}
      />
    </EuiFormRow>
  );
}

export interface ServiceMapEditorFlyoutProps {
  onCancel: () => void;
  onSave: (state: ServiceMapEmbeddableState) => void;
  initialState?: ServiceMapEmbeddableState;
  ariaLabelledBy: string;
  deps: EmbeddableDeps;
  timeRange?: TimeRange;
}

function getEnvironmentOptions(environments: string[]) {
  const environmentOptions = environments
    .filter((env) => env !== ENVIRONMENT_NOT_DEFINED.value)
    .map((environment) => ({
      value: environment,
      label: environment,
    }));

  return [
    ENVIRONMENT_ALL,
    ...(environments.includes(ENVIRONMENT_NOT_DEFINED.value) ? [ENVIRONMENT_NOT_DEFINED] : []),
    ...environmentOptions,
  ];
}

const DEFAULT_RANGE_FROM = 'now-15m';
const DEFAULT_RANGE_TO = 'now';

/** Flex shell so header/body/footer lay out inside Core flyouts without changing `OverlayMountWrapper`. */
const serviceMapFlyoutShellStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 0%',
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
};

function getTimeRange(timeRange?: Partial<TimeRange>) {
  const rangeFrom = timeRange?.from ?? DEFAULT_RANGE_FROM;
  const rangeTo = timeRange?.to ?? DEFAULT_RANGE_TO;
  const start = datemath.parse(rangeFrom)?.toISOString() ?? rangeFrom;
  const end = datemath.parse(rangeTo, { roundUp: true })?.toISOString() ?? rangeTo;
  return { start, end };
}

export function ServiceMapEditorFlyout({
  onCancel,
  onSave,
  initialState,
  ariaLabelledBy,
  deps,
  timeRange,
}: ServiceMapEditorFlyoutProps) {
  const isEditing = !!initialState;

  const [environment, setEnvironment] = useState<Environment>(
    initialState?.environment ?? ENVIRONMENT_ALL.value
  );
  const [kuery, setKuery] = useState(initialState?.kuery ?? '');
  const [serviceName, setServiceName] = useState(initialState?.service_name ?? '');
  const [syncWithDashboardFilters, setSyncWithDashboardFilters] = useState<boolean>(
    initialState?.sync_with_dashboard_filters ?? false
  );

  const [connectionFilter, setConnectionFilter] = useState<ConnectionFilter[]>(
    (initialState?.connection_filter ?? []) as ConnectionFilter[]
  );
  const [alertStatusFilter, setAlertStatusFilter] = useState<AlertStatus[]>(
    (initialState?.alert_status_filter ?? []) as AlertStatus[]
  );
  const [sloStatusFilter, setSloStatusFilter] = useState<SloStatus[]>(
    (initialState?.slo_status_filter ?? []) as SloStatus[]
  );
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState<ML_ANOMALY_SEVERITY[]>(
    (initialState?.anomaly_severity_filter ?? []) as ML_ANOMALY_SEVERITY[]
  );
  const [mapOrientation, setMapOrientation] = useState<ServiceMapOrientation>(
    initialState?.map_orientation ?? 'horizontal'
  );

  const orientationIdPrefix = useMemo(() => htmlIdGenerator()(), []);
  const orientationOptions: EuiButtonGroupOptionProps[] = useMemo(
    () => [
      {
        id: `${orientationIdPrefix}horizontal`,
        label: i18n.translate('xpack.apm.serviceMapEditor.layoutHorizontal', {
          defaultMessage: 'Horizontal',
        }),
        iconType: 'arrowRight',
        'data-test-subj': 'apmServiceMapEditorLayoutHorizontal',
      },
      {
        id: `${orientationIdPrefix}vertical`,
        label: i18n.translate('xpack.apm.serviceMapEditor.layoutVertical', {
          defaultMessage: 'Vertical',
        }),
        iconType: 'arrowDown',
        'data-test-subj': 'apmServiceMapEditorLayoutVertical',
      },
    ],
    [orientationIdPrefix]
  );

  const [selectedServiceOption, setSelectedServiceOption] = useState<
    Array<EuiComboBoxOptionOption<string>>
  >(serviceName ? [{ value: serviceName, label: serviceName }] : []);
  const [selectedEnvironmentOption, setSelectedEnvironmentOption] = useState<
    Array<EuiComboBoxOptionOption<string>>
  >([{ value: environment, label: getEnvironmentLabel(environment) }]);

  const rangeFrom = timeRange?.from;
  const rangeTo = timeRange?.to;
  const { start, end } = useMemo(
    () => getTimeRange({ from: rangeFrom, to: rangeTo }),
    [rangeFrom, rangeTo]
  );

  const {
    terms: serviceNameTerms,
    isLoading: isLoadingServiceNames,
    onSearchChange: onServiceNameSearchChange,
  } = useSuggestions({
    core: deps.coreStart,
    fieldName: SERVICE_NAME,
    start,
    end,
    fetchOnMount: true,
  });

  const {
    terms: environmentTerms,
    isLoading: isLoadingEnvironments,
    onSearchChange: onEnvironmentSearchChange,
  } = useSuggestions({
    core: deps.coreStart,
    fieldName: SERVICE_ENVIRONMENT,
    start,
    end,
    serviceName: serviceName || undefined,
    fetchOnMount: true,
  });

  const serviceNameOptions = useMemo<Array<EuiComboBoxOptionOption<string>>>(
    () => serviceNameTerms.map((term) => ({ value: term, label: term })),
    [serviceNameTerms]
  );

  const environmentOptions = useMemo<Array<EuiComboBoxOptionOption<string>>>(
    () => getEnvironmentOptions(environmentTerms),
    [environmentTerms]
  );

  const onServiceNameSelect = (changedOptions: Array<EuiComboBoxOptionOption<string>>) => {
    if (changedOptions.length === 0) {
      setServiceName('');
      setSelectedServiceOption([]);
    } else if (changedOptions.length === 1 && changedOptions[0].value) {
      setServiceName(changedOptions[0].value);
      setSelectedServiceOption(changedOptions);
    }
    setEnvironment(ENVIRONMENT_ALL.value);
    setSelectedEnvironmentOption([ENVIRONMENT_ALL]);
  };

  const onEnvironmentSelect = (changedOptions: Array<EuiComboBoxOptionOption<string>>) => {
    if (changedOptions.length === 1 && changedOptions[0].value) {
      setEnvironment(changedOptions[0].value as Environment);
      setSelectedEnvironmentOption(changedOptions);
    }
  };

  const handleSave = useCallback(() => {
    const state: ServiceMapEmbeddableState = {
      environment,
      kuery: kuery.trim() ? kuery : undefined,
      service_name: serviceName || undefined,
      sync_with_dashboard_filters: syncWithDashboardFilters,
      connection_filter: connectionFilter.length
        ? (connectionFilter as ServiceMapEmbeddableState['connection_filter'])
        : undefined,
      alert_status_filter: alertStatusFilter.length
        ? (alertStatusFilter as ServiceMapEmbeddableState['alert_status_filter'])
        : undefined,
      slo_status_filter: sloStatusFilter.length
        ? (sloStatusFilter as ServiceMapEmbeddableState['slo_status_filter'])
        : undefined,
      anomaly_severity_filter: anomalySeverityFilter.length
        ? (anomalySeverityFilter as ServiceMapEmbeddableState['anomaly_severity_filter'])
        : undefined,
      map_orientation: mapOrientation,
    };
    onSave(state);
  }, [
    environment,
    kuery,
    serviceName,
    syncWithDashboardFilters,
    connectionFilter,
    alertStatusFilter,
    sloStatusFilter,
    anomalySeverityFilter,
    mapOrientation,
    onSave,
  ]);

  return (
    <div style={serviceMapFlyoutShellStyle}>
      <EuiFlyoutHeader hasBorder data-test-subj="apmServiceMapEditorFlyout">
        <EuiTitle size="s">
          <h2 id={ariaLabelledBy}>
            {isEditing ? (
              <FormattedMessage
                id="xpack.apm.serviceMapEditor.editTitle"
                defaultMessage="Edit service map"
              />
            ) : (
              <FormattedMessage
                id="xpack.apm.serviceMapEditor.addTitle"
                defaultMessage="Create service map panel"
              />
            )}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody style={{ flex: '1 1 auto', minHeight: 0 }}>
        <EuiForm fullWidth>
          <EuiFormRow
            label={i18n.translate('xpack.apm.serviceMapEditor.serviceNameLabel', {
              defaultMessage: 'Service name (optional)',
            })}
            helpText={i18n.translate('xpack.apm.serviceMapEditor.serviceNameHelpText', {
              defaultMessage:
                'Filter to show only a specific service and its connections. Leave blank to show all services.',
            })}
            fullWidth
          >
            <EuiComboBox
              aria-label={i18n.translate(
                'xpack.apm.serviceMapEditor.serviceNameComboBox.ariaLabel',
                {
                  defaultMessage: 'Select service name',
                }
              )}
              compressed
              fullWidth
              async
              isClearable
              placeholder={i18n.translate('xpack.apm.serviceMapEditor.serviceNamePlaceholder', {
                defaultMessage: 'Search for a service...',
              })}
              singleSelection={{ asPlainText: true }}
              options={serviceNameOptions}
              selectedOptions={selectedServiceOption}
              onChange={onServiceNameSelect}
              onSearchChange={onServiceNameSearchChange}
              isLoading={isLoadingServiceNames}
              data-test-subj="apmServiceMapEditorServiceNameComboBox"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('xpack.apm.serviceMapEditor.environmentLabel', {
              defaultMessage: 'Environment',
            })}
            fullWidth
          >
            <EuiComboBox
              aria-label={i18n.translate(
                'xpack.apm.serviceMapEditor.environmentComboBox.ariaLabel',
                {
                  defaultMessage: 'Select environment',
                }
              )}
              compressed
              fullWidth
              async
              isClearable={false}
              placeholder={i18n.translate('xpack.apm.serviceMapEditor.environmentPlaceholder', {
                defaultMessage: 'Select environment',
              })}
              singleSelection={{ asPlainText: true }}
              options={environmentOptions}
              selectedOptions={selectedEnvironmentOption}
              onChange={onEnvironmentSelect}
              onSearchChange={onEnvironmentSearchChange}
              isLoading={isLoadingEnvironments}
              data-test-subj="apmServiceMapEditorEnvironmentComboBox"
            />
          </EuiFormRow>

          <KueryInput kuery={kuery} onChange={setKuery} deps={deps} />

          <EuiHorizontalRule margin="m" />

          <EuiText size="xs">
            <h3>
              {i18n.translate('xpack.apm.serviceMapEditor.filtersHeading', {
                defaultMessage: 'Filters',
              })}
            </h3>
          </EuiText>

          <FilterComboBox<ConnectionFilter>
            label={i18n.translate('xpack.apm.serviceMapEditor.dependenciesFilterLabel', {
              defaultMessage: 'Dependencies',
            })}
            placeholder={i18n.translate(
              'xpack.apm.serviceMapEditor.dependenciesFilterPlaceholder',
              {
                defaultMessage: 'All dependencies',
              }
            )}
            options={CONNECTION_FILTER_OPTIONS}
            selected={connectionFilter}
            onChange={setConnectionFilter}
            dataTestSubj="apmServiceMapEditorConnectionFilter"
          />

          <FilterComboBox<AlertStatus>
            label={i18n.translate('xpack.apm.serviceMapEditor.alertStatusFilterLabel', {
              defaultMessage: 'Alert status',
            })}
            placeholder={i18n.translate('xpack.apm.serviceMapEditor.alertStatusFilterPlaceholder', {
              defaultMessage: 'All alert statuses',
            })}
            options={ALERT_STATUS_OPTIONS}
            selected={alertStatusFilter}
            onChange={setAlertStatusFilter}
            dataTestSubj="apmServiceMapEditorAlertStatusFilter"
          />

          <FilterComboBox<SloStatus>
            label={i18n.translate('xpack.apm.serviceMapEditor.sloStatusFilterLabel', {
              defaultMessage: 'SLO status',
            })}
            placeholder={i18n.translate('xpack.apm.serviceMapEditor.sloStatusFilterPlaceholder', {
              defaultMessage: 'All SLO statuses',
            })}
            options={SLO_STATUS_OPTIONS}
            selected={sloStatusFilter}
            onChange={setSloStatusFilter}
            dataTestSubj="apmServiceMapEditorSloStatusFilter"
          />

          <FilterComboBox<ML_ANOMALY_SEVERITY>
            label={i18n.translate('xpack.apm.serviceMapEditor.anomalySeverityFilterLabel', {
              defaultMessage: 'Anomaly severity',
            })}
            placeholder={i18n.translate(
              'xpack.apm.serviceMapEditor.anomalySeverityFilterPlaceholder',
              {
                defaultMessage: 'All severities',
              }
            )}
            options={ANOMALY_SEVERITY_OPTIONS}
            selected={anomalySeverityFilter}
            onChange={setAnomalySeverityFilter}
            dataTestSubj="apmServiceMapEditorAnomalySeverityFilter"
          />

          <EuiHorizontalRule margin="m" />

          <EuiText size="xs">
            <h3>
              {i18n.translate('xpack.apm.serviceMapEditor.presentationHeading', {
                defaultMessage: 'Presentation',
              })}
            </h3>
          </EuiText>

          <EuiFormRow
            label={i18n.translate('xpack.apm.serviceMapEditor.layoutLabel', {
              defaultMessage: 'Layout',
            })}
            fullWidth
          >
            <EuiButtonGroup
              isFullWidth
              legend={i18n.translate('xpack.apm.serviceMapEditor.layoutLegend', {
                defaultMessage: 'Map layout orientation',
              })}
              buttonSize="compressed"
              options={orientationOptions}
              idSelected={`${orientationIdPrefix}${mapOrientation}`}
              onChange={(optionId) => {
                const suffix = optionId.slice(orientationIdPrefix.length);
                if (suffix === 'horizontal' || suffix === 'vertical') {
                  setMapOrientation(suffix);
                }
              }}
              data-test-subj="apmServiceMapEditorLayoutOrientationButtonGroup"
            />
          </EuiFormRow>

          <EuiHorizontalRule margin="m" />

          <EuiFormRow
            helpText={i18n.translate('xpack.apm.serviceMapEditor.syncFiltersHelpText', {
              defaultMessage:
                "When on, the panel responds to the dashboard's global filters and search. Time range is not synced — it stays panel-owned.",
            })}
            fullWidth
          >
            <EuiSwitch
              label={i18n.translate('xpack.apm.serviceMapEditor.syncFiltersLabel', {
                defaultMessage: 'Sync with dashboard filters',
              })}
              checked={syncWithDashboardFilters}
              onChange={(e) => setSyncWithDashboardFilters(e.target.checked)}
              data-test-subj="apmServiceMapEditorSyncFiltersToggle"
            />
          </EuiFormRow>
        </EuiForm>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              onClick={onCancel}
              color="primary"
              size="m"
              flush="left"
              data-test-subj="apmServiceMapEditorCancelButton"
            >
              <FormattedMessage
                id="xpack.apm.serviceMapEditor.cancelButton"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={handleSave}
              fill
              color="primary"
              size="m"
              data-test-subj="apmServiceMapEditorSaveButton"
            >
              {isEditing ? (
                <FormattedMessage
                  id="xpack.apm.serviceMapEditor.saveButton"
                  defaultMessage="Save"
                />
              ) : (
                <FormattedMessage
                  id="xpack.apm.serviceMapEditor.addPanelButton"
                  defaultMessage="Add panel"
                />
              )}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </div>
  );
}
