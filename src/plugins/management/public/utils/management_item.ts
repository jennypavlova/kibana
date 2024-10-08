/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { CreateManagementItemArgs } from '../types';

export class ManagementItem {
  public readonly id: string = '';
  public readonly title: string;
  public readonly tip?: string;
  public readonly order: number;
  public readonly hideFromSidebar?: boolean;
  public readonly euiIconType?: string;
  public readonly icon?: string;
  public readonly capabilitiesId?: string;
  public readonly redirectFrom?: string;

  public enabled: boolean = true;

  constructor({
    id,
    title,
    tip,
    order = 100,
    hideFromSidebar = false,
    euiIconType,
    icon,
    capabilitiesId,
    redirectFrom,
  }: CreateManagementItemArgs) {
    this.id = id;
    this.title = title;
    this.tip = tip;
    this.order = order;
    this.hideFromSidebar = hideFromSidebar;
    this.euiIconType = euiIconType;
    this.icon = icon;
    this.capabilitiesId = capabilitiesId;
    this.redirectFrom = redirectFrom;
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
