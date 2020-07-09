// @flow

import type { Event, EventData } from '../types';
import type EventManager from '../managers/EventManager';
import type DeviceManager from '../managers/DeviceManager';

import Controller from './Controller';
import anonymous from '../decorators/anonymous';
import route from '../decorators/route';
import httpVerb from '../decorators/httpVerb';
import serverSentEvents from '../decorators/serverSentEvents';
import eventToApi from '../lib/eventToApi';
import Logger from '../lib/logger';
const logger = Logger.createModuleLogger(module);

const KEEP_ALIVE_INTERVAL = 9000;

class EventsController extends Controller {
  _eventManager: EventManager;
  _deviceManager: DeviceManager;
  _keepAliveIntervalID: ?string = null;
  _lastEventDate: Date = new Date();

  constructor(eventManager: EventManager, deviceManager: DeviceManager) {
    super();

    this._eventManager = eventManager;
    this._deviceManager = deviceManager;
  }

  @httpVerb('post')
  @route('/v1/ping')
  @anonymous()
  async ping(payload: Object): Promise<*> {
    return this.ok({
      ...payload,
      serverPayload: Math.random(),
    });
  }

  @httpVerb('get')
  @route('/v1/events/:eventNamePrefix?*')
  @serverSentEvents()
  async getEvents(eventNamePrefix: ?string): Promise<*> {
    const subscriptionID = this._eventManager.subscribe(
      eventNamePrefix,
      this._pipeEvent.bind(this),
      ...this._getUserFilter(),
    );
    const keepAliveIntervalID = this._startKeepAlive();

    this._closeStream(subscriptionID, keepAliveIntervalID);
  }

  @httpVerb('get')
  @route('/v1/devices/events/:eventNamePrefix?*')
  @serverSentEvents()
  async getMyEvents(eventNamePrefix: ?string): Promise<*> {
    const subscriptionID = this._eventManager.subscribe(
      eventNamePrefix,
      this._pipeEvent.bind(this),
      {
        mydevices: true,
        ...this._getUserFilter(),
      },
    );
    const keepAliveIntervalID = this._startKeepAlive();

    this._closeStream(subscriptionID, keepAliveIntervalID);
  }

  @httpVerb('get')
  @route('/v1/devices/:deviceIDorName/events/:eventNamePrefix?*')
  @serverSentEvents()
  async getDeviceEvents(
    deviceIDorName: string,
    eventNamePrefix: ?string,
  ): Promise<*> {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    const subscriptionID = this._eventManager.subscribe(
      eventNamePrefix,
      this._pipeEvent.bind(this),
      {
        deviceID,
        ...this._getUserFilter(),
      },
    );
    const keepAliveIntervalID = this._startKeepAlive();

    this._closeStream(subscriptionID, keepAliveIntervalID);
  }

  @httpVerb('post')
  @route('/v1/devices/events')
  async publish(postBody: {
    name: string,
    data?: string,
    private: boolean,
    ttl?: number,
  }): Promise<*> {
    const eventData: EventData = {
      data: postBody.data,
      isPublic: !postBody.private,
      name: postBody.name,
      ttl: postBody.ttl,
      ...this._getUserFilter(),
    };

    this._eventManager.publish(eventData);
    return this.ok({ ok: true });
  }

  _closeStream(subscriptionID: string, keepAliveIntervalID: IntervalID): void {
    const closeStreamHandler = () => {
      this._eventManager.unsubscribe(subscriptionID);
      clearInterval(keepAliveIntervalID);
    };

    this.request.on('close', closeStreamHandler);
    this.request.on('end', closeStreamHandler);
    this.response.on('finish', closeStreamHandler);
    this.response.on('end', closeStreamHandler);
  }

  _getUserFilter(): Object {
    return this.user.role === 'administrator' ? {} : { userID: this.user.id };
  }

  _startKeepAlive(): IntervalID {
    return setInterval(() => {
      if (new Date() - this._lastEventDate >= KEEP_ALIVE_INTERVAL) {
        this.response.write('\n');
        this._updateLastEventDate();
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  _pipeEvent(event: Event) {
    try {
      this.response.write(`event: ${event.name || ''}\n`);
      this.response.write(`data: ${JSON.stringify(eventToApi(event))}\n\n`);
      this._updateLastEventDate();
    } catch (error) {
      logger.error(
        { deviceID: event.deviceID, err: error, event },
        'pipeEvents - write error',
      );
      throw error;
    }
  }

  _updateLastEventDate() {
    this._lastEventDate = new Date();
  }
}

export default EventsController;
