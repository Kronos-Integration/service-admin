import { StreamTransformInterceptor } from "@kronos-integration/interceptor-stream";
import { createGunzip, createGzip } from "zlib";

/**
 * Decompress requests with gunzip
 */
export class GunzipInterceptor extends StreamTransformInterceptor {
  /**
   * @return {string} 'gunzip'
   */
  static get name() {
    return "gunzip";
  }

  createTransformer(endpoint) {
    return createGunzip();
  }

  /*receive(endpoint, next, request) {
    return next(request.pipe(createGunzip()));
  }*/
}

/**
 * Compress requests with gzip
 */
export class GzipInterceptor extends StreamTransformInterceptor {
  /**
   * @return {string} 'gzip'
   */
  static get name() {
    return "gzip";
  }

  createTransformer(endpoint) {
    return createGzip();
  }

/*  receive(endpoint, next, request) {
    return next(request.pipe(createGzip()));
  }*/
}
