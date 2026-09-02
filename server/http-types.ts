import type { IncomingHttpHeaders } from "node:http";
import type { ServerResponse } from "node:http";
import type { Socket } from "node:net";

export type HeaderValue = string | string[] | undefined;

export interface ApiRequest {
  method?: string;
  headers: IncomingHttpHeaders;
  socket: Pick<Socket, "remoteAddress">;
  body?: unknown;
  query?: Record<string, HeaderValue>;
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | string>;
}

export interface ApiResponse
  extends Pick<ServerResponse, "setHeader" | "getHeader" | "end"> {
  statusCode: number;
  status?(code: number): ApiResponse;
  json?(body: unknown): void;
}

export type ApiHandler = (request: ApiRequest, response: ApiResponse) => Promise<void>;
