/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Serializable, timerange } from '@kbn/synthtrace-client';

/**
 * OpenTelemetry semantic-convention host metrics for the Infra Hosts view
 * (see src/platform/packages/shared/kbn-synthtrace/src/scenarios/infra_hosts_semconv.ts).
 */
export function generateHostsSemconvData({
  from,
  to,
  count = 1,
}: {
  from: Date;
  to: Date;
  count?: number;
}) {
  const range = timerange(from.toISOString(), to.toISOString());

  const hosts = Array(count)
    .fill(0)
    .map((_, idx) => `semconv-host-${idx}`);

  return range
    .interval('30s')
    .rate(1)
    .generator((timestamp) =>
      hosts.flatMap((hostName) => {
        const base = {
          'agent.id': `agent-${hostName}`,
          'host.hostname': hostName,
          '@timestamp': timestamp,
          'host.name': hostName,
          'host.os.name': 'linux',
          'cloud.provider': 'aws',
          'cloud.region': 'us-east-1',
          'host.ip': '122.122.122.122',
          'resource.attributes.host.name': hostName,
          'resource.attributes.os.type': 'linux',
          'data_stream.dataset': 'hostmetricsreceiver.otel',
          'data_stream.type': 'metrics',
          'data_stream.namespace': 'default',
        };

        const cpuIdleUtilization = 0.3 + Math.random() * 0.4;
        const cpuWaitUtilization = Math.random() * 0.1;
        const cpuDocs = [
          { state: 'idle', 'system.cpu.utilization': cpuIdleUtilization },
          { state: 'wait', 'system.cpu.utilization': cpuWaitUtilization },
          { state: 'user', 'system.cpu.utilization': Math.random() * 0.3 },
          { state: 'system', 'system.cpu.utilization': Math.random() * 0.2 },
        ].map((cpu) => ({
          ...base,
          ...cpu,
          'metricset.name': 'cpu',
          'system.cpu.logical.count': 4,
          'system.cpu.load_average.1m': 1 + Math.random() * 3,
        }));

        const totalMemory = 16 * 1024 * 1024 * 1024;
        const usedMemory = totalMemory * (0.4 + Math.random() * 0.3);
        const freeMemory = totalMemory - usedMemory;
        const memDocs = [
          {
            state: 'used',
            'system.memory.utilization': usedMemory / totalMemory,
            'system.memory.usage': usedMemory,
          },
          {
            state: 'free',
            'system.memory.utilization': freeMemory / totalMemory,
            'system.memory.usage': freeMemory,
          },
          {
            state: 'cached',
            'system.memory.utilization': 0.1,
            'system.memory.usage': totalMemory * 0.1,
          },
          {
            state: 'buffered',
            'system.memory.utilization': 0.05,
            'system.memory.usage': totalMemory * 0.05,
          },
          {
            state: 'slab_reclaimable',
            'system.memory.utilization': 0.02,
            'system.memory.usage': totalMemory * 0.02,
          },
          {
            state: 'slab_unreclaimable',
            'system.memory.utilization': 0.01,
            'system.memory.usage': totalMemory * 0.01,
          },
        ].map((mem) => ({
          ...base,
          ...mem,
          'metricset.name': 'memory',
        }));

        const diskDoc = {
          ...base,
          'metricset.name': 'filesystem',
          'metrics.system.filesystem.utilization': 0.3 + Math.random() * 0.4,
        };

        const networkDocs = [
          {
            direction: 'transmit',
            'system.network.io': Math.floor(Math.random() * 1000000000),
          },
          {
            direction: 'receive',
            'system.network.io': Math.floor(Math.random() * 1000000000),
          },
        ].map((net) => ({
          ...base,
          ...net,
          'metricset.name': 'network',
          'device.keyword': 'eth0',
        }));

        return [...cpuDocs, ...memDocs, diskDoc, ...networkDocs].map(
          (doc) => new Serializable(doc)
        );
      })
    );
}
