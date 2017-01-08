// @flow

import type {
  $Application,
  $Request,
  $Response,
  Middleware,
  NextFunction,
} from 'express';
import type {Container} from 'constitute';
import type { Settings } from './types';
import type Controller from './controllers/Controller';

import OAuthServer from 'express-oauth-server';
import multer from 'multer';
import OAuthModel from './OAuthModel';
import HttpError from './lib/HttpError';

// TODO fix flow errors, come up with better name;
const maybe = (middleware: Middleware, condition: boolean): Middleware =>
  (request: $Request, response: $Response, next: NextFunction) => {
    if (condition) {
      middleware(request, response, next);
    } else {
      next();
    }
  };

const injectUserMiddleware = (): Middleware =>
  (request: $Request, response: $Response, next: NextFunction) => {
    const oauthInfo = response.locals.oauth;
    if (oauthInfo) {
      const token = (oauthInfo: any).token;
      // eslint-disable-next-line no-param-reassign
      (request: any).user = token && token.user;
    }
    next();
  };

// in old codebase there was _keepAlive() function in controllers , which
// prevents of closing server-sent-events stream if there aren't events for
// a long time, but according to the docs sse keep connection alive automatically.
// if there will be related issues in the future, we can return _keepAlive() back.
const serverSentEventsMiddleware = (): Middleware =>
  (request: $Request, response: $Response, next: NextFunction) => {
    request.socket.setNoDelay();
    response.writeHead(
      200,
      {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      },
    );

    next();
  };

const defaultMiddleware =
  (request: $Request, response: $Response, next: NextFunction): mixed => next();

export default (
  app: $Application,
  container: Container,
  controllers: Array<string>,
  settings: Settings,
) => {
  const oauth = new OAuthServer({
    accessTokenLifetime: settings.accessTokenLifetime,
    allowBearerTokensInQueryString: true,
    model: new OAuthModel(container.constitute('UserRepository')),
  });
  const injectFilesMiddleware = multer();

  app.post(settings.loginRoute, oauth.token());

  controllers.forEach((controllerName: string) => {
    const controller = container.constitute(controllerName);
    Object.getOwnPropertyNames(
      (Object.getPrototypeOf(controller): any),
    ).forEach((functionName: string) => {
      const mappedFunction = (controller: any)[functionName];
      const {
        allowedUploads,
        anonymous,
        httpVerb,
        route,
        serverSentEvents,
      } = mappedFunction;

      if (!httpVerb) {
        return;
      }

      (app: any)[httpVerb](
        route,
        maybe(oauth.authenticate(), !anonymous),
        maybe(serverSentEventsMiddleware(), serverSentEvents),
        injectUserMiddleware(),
        allowedUploads
          ? injectFilesMiddleware.fields(allowedUploads)
          : defaultMiddleware,
        async (request: $Request, response: $Response): Promise<void> => {
          const argumentNames = (route.match(/:[\w]*/g) || []).map(
            (argumentName: string): string => argumentName.replace(':', ''),
          );
          const values = argumentNames
            .map((argument: string): string => request.params[argument]);

          const controllerContext = Object.create(controller);
          controllerContext.request = request;
          controllerContext.response = response;
          controllerContext.user = (request: any).user;

          // Take access token out if it's posted.
          const {
            access_token, // eslint-disable-line no-unused-vars
            ...body
          } = request.body;

          try {
            const functionResult = mappedFunction.call(
              controllerContext,
              ...values,
              body,
            );

            if (functionResult.then) {
              const result = await functionResult;
              response.status(result.status).json(result.data);
            } else {
              response.status(functionResult.status).json(functionResult.data);
            }
          } catch (error) {
            const httpError = new HttpError(error);
            response.status(httpError.status).json({
              error: httpError.message,
              ok: false,
            });
          }
        });
    });
  });

  app.all('*', (request: $Request, response: $Response) => {
    response.sendStatus(404);
  });

  (app: any).use((
    error: string,
    request: $Request,
    response: $Response,
  ) => {
    response
      .status(400)
      .json({
        error: error.code ? error.code : error,
        ok: false,
      });
  });
};
