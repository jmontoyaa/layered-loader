<div align="center">
    <img
      src="https://raw.githubusercontent.com/kibertoad/layered-loader/main/graphics/raw/layered-loader_full-color_transparent.svg"
      width="260"
      height="auto"
    />
  </a>
</div>

[![npm version](http://img.shields.io/npm/v/layered-loader.svg)](https://npmjs.org/package/layered-loader)
[![](https://img.shields.io/npm/dm/layered-loader.svg)](https://npmjs.org/package/layered-loader)
![](https://github.com/kibertoad/layered-loader/workflows/ci/badge.svg)
[![Coverage Status](https://coveralls.io/repos/kibertoad/layered-loader/badge.svg?branch=main)](https://coveralls.io/r/kibertoad/layered-loader?branch=main)

Data source agnostic data loader with support for tiered in-memory and async caching, fetch deduplication and fallback data sources. Implements Cache-Aside, Read-Through and Refresh-Ahead patterns.

Special thanks to Diana Baužytė for creating the project logo.

You can watch [NodeConf EU 2023 talk](https://www.youtube.com/watch?v=O0Nk3XhxxYg) for a brief and visual overview of what new features `layered-loader` brings to the table of the Node.js caching.

## Prerequisites

Node: 16+

## Use-cases

This library has four main goals:

1. Provide transparent, high performance, flexible caching mechanism for data retrieval operations;
2. Prevent redundant data retrieval in high-load systems;
3. Support distributed in-memory cache invalidation to prevent stale data in cache;
4. Enable fallback mechanism for retrieving data when alternate sources exist;

## Feature Comparison

Since there are a few cache solutions, here is a table comparing them:

| Feature                                          | [layered-loader](https://github.com/kibertoad/layered-loader) | [async-cache-dedupe](https://github.com/mcollina/async-cache-dedupe) | [dataloader](https://github.com/graphql/dataloader) | [cache-manager](https://github.com/node-cache-manager/node-cache-manager) |
| :----------------------------------------------- | :-----------------------------------------------------------: | :------------------------------------------------------------------: | :-------------------------------------------------: | :-----------------------------------------------------------------------: |
| Single Entity Fetch                              |                               ✓                               |                                  ✓                                   |                          ✓                          |                                     ✓                                     |
| Bulk Entity Fetch                                |                               ✓                               |                                                                      |                          ✓                          |                                     ✓                                     |
| Single Entity Fetch Deduplication (Read-Through) |                               ✓                               |                                  ✓                                   |                          ✓                          |                                                                           |
| Bulk Entity Fetch Deduplication                  |                                                               |                                                                      |                          ✓                          |                                                                           |
| Preemptive Cache Refresh (Refresh-Ahead)         |                               ✓                               |                                                                      |                                                     |                                                                           |
| Tiered Caches                                    |                               ✓                               |                                                                      |                                                     |                                     ✓                                     |
| Group Support                                    |                               ✓                               |                partially, references for invalidation                |                                                     |                                                                           |
| Redis Support                                    |                               ✓                               |                                  ✓                                   |                                                     |                                     ✓                                     |
| Redis Key Auto-Prefixing                         |                               ✓                               |                                                                      |                                                     |                                                                           |
| Synchronous In-Memory Cache Access               |                               ✓                               |                                                                      |                                                     |                                                                           |
| Distributed In-Memory Cache Invalidation         |                               ✓                               |                                                                      |                                                     |                                                                           |
| Hit/Miss/Expiration Tracking                     |                               ✓                               |                      partially, hooks available                      |                                                     |                                                                           |
| Support For Custom Cache Stores                  |                               ✓                               |                                                                      |                                                     |                                     ✓                                     |
| Optimized for                                    |                        Broad‑Scope Use                        |                  Single Entity Fetch Deduplication                   |           Bulk Entity Fetch Deduplication           |                              Manual Caching                               |

## Performance Comparison

You can find all the benchmarks used for the comparison in [NodeJS benchmark repo](https://github.com/kibertoad/nodejs-benchmark-tournament). Please let us know if they can be made more accurate!

### In-Memory Store

Higher is better:

| Feature - Ops/sec              | [layered-loader](https://github.com/kibertoad/layered-loader) | [async-cache-dedupe](https://github.com/mcollina/async-cache-dedupe) | [dataloader](https://github.com/graphql/dataloader) | [cache-manager](https://github.com/node-cache-manager/node-cache-manager) | [toad-cache](https://github.com/kibertoad/toad-cache) | [tiny-lru](https://github.com/avoidwork/tiny-lru) |
| :----------------------------- | :-----------------------------------------------------------: | :------------------------------------------------------------------: | :-------------------------------------------------: | :-----------------------------------------------------------------------: | :---------------------------------------------------: | :-----------------------------------------------: |
| Single Entity Fetch            |                           3836.436                            |                               446.146                                |                       717.420                       |                                   ToDo                                    |                       4191.279                        |                     3818.146                      |
| Bulk Entity Fetch              |                                                               |                                                                      |                                                     |                                                                           |                                                       |                                                   |
| Concurrent Single Entity Fetch |                                                               |                                                                      |                                                     |                                                                           |                                                       |                                                   |
| Concurrent Bulk Entity Fetch   |                                                               |                                                                      |                                                     |                                                                           |                                                       |                                                   |

### Redis Store

Higher is better:

| Feature - Ops/sec              | [layered-loader](https://github.com/kibertoad/layered-loader) | [async-cache-dedupe](https://github.com/mcollina/async-cache-dedupe) | [cache-manager](https://github.com/node-cache-manager/node-cache-manager) | [ioredis](https://github.com/redis/ioredis) |
| :----------------------------- | :-----------------------------------------------------------: | :------------------------------------------------------------------: | :-----------------------------------------------------------------------: | :-----------------------------------------: |
| Single Entity Fetch            |                                                               |                                                                      |                                                                           |                                             |
| Bulk Entity Fetch              |                                                               |                                                                      |                                                                           |                                             |
| Concurrent Single Entity Fetch |                            167.745                            |                               124.854                                |                                  40.234                                   |                   47.775                    |
| Concurrent Bulk Entity Fetch   |                                                               |                                                                      |                                                                           |                                             |

## Basic concepts

###

There are two main entity types defined by `layered-loader`:

1. **Loader** - defined procedure of retrieving data from one or more data sources with full deduplication (same resource is only asked once at any given time), with an optional caches in the middle. Loader is composed of Data Sources and Caches.
2. **Manual cache** - async cache and/or sync in-memory cache, with deduplication for retrieval commands, which is populated explicitly.

Loaders and caches are composed out of the following building blocks.

1. **InMemoryCache** - synchronous in-memory cache. Offers highest possible performance. If used with a longer TTL, you should consider using a notification Publisher/Consumer pair for distributed cache invalidation, to prevent your cached data from becoming stale;
2. **AsyncCache** - asynchronous remote cache. Slower than in-memory cache, but can be invalidated more easily, as it is shared across all nodes of a distributed system.
3. **Data Source** - primary source of truth of data, that can be used for populating caches. Used in a strictly read-only mode.

- `layered-loader` will try loading the data from the data source defined for the Loader, in the following order: InMemory, AsyncCache, DataSources. In case `undefined` value is the result of retrieval, next source in sequence will be used, until there is either a value, or there are no more sources available;
- `null` is considered to be a value, and if the data source returns it, subsequent data source will not be queried for data;
- If non-last data source throws an error, it is handled using configured ErrorHandler. If the last data source throws an error, and there are no remaining fallback data sources, an error will be thrown by the Loader.
- If any caches (InMemoryCache or AsyncCache) precede the source, that returned a value, all of them will be updated with that value;
- If there is an ongoing retrieval operation for the given key, promise for that retrieval will be reused and returned as a result of `loader.get`, instead of starting a new retrieval.
- You can use just the memory cache, just the asynchronous one, neither, or both. Unconfigured layer will be simply skipped for all operations (both storage and retrieval).

## Basic example

Let's define a data source, which will be the primary source of truth, and two levels of caching:

```ts
import Redis from 'ioredis'
import { RedisCache, InMemoryCache } from 'layered-loader'
import type { DataSource } from 'layered-loader'

const ioRedis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'sOmE_sEcUrE_pAsS',
})

class ClassifiersDataSource implements DataSource<Record<string, any>> {
  private readonly db: Knex
  name = 'Classifiers DB loader'
  isCache = false

  constructor(db: Knex) {
    this.db = db
  }

  async get(key: string): Promise<Record<string, any> | undefined | null> {
    const results = await this.db('classifiers')
      .select('*')
      .where({
        id: parseInt(key),
      })
    return results[0]
  }

  async getMany(keys: string[]): Promise<Record<string, any>[]> {
    return this.db('classifiers').select('*').whereIn('id', keys.map(parseInt))
  }
}

const loader = new Loader<string>({
  // this cache will be checked first
  inMemoryCache: {
    cacheType: 'lru-object', // you can choose between lru and fifo caches, fifo being 10% slightly faster
    ttlInMsecs: 1000 * 60,
    maxItems: 100,
  },

  // this cache will be checked if in-memory one returns undefined
  asyncCache: new RedisCache(ioRedis, {
    json: true, // this instructs loader to serialize passed objects as string and deserialize them back to objects
    ttlInMsecs: 1000 * 60 * 10,
  }),

  // this will be used if neither cache has the requested data
  dataSources: [new ClassifiersDataSource(db)],
})

// If cache is empty, but there is data in the DB, after this operation is completed, both caches will be populated
const classifier = await loader.get('1')
```

### Simplified loader syntax

It is also possible to inline datasource definition:

```ts
const loader = new Loader<string>({
  // this cache will be checked first
  inMemoryCache: {
    cacheType: 'lru-object', // you can choose between lru and fifo caches, fifo being 10% slightly faster
    ttlInMsecs: 1000 * 60,
    maxItems: 100,
  },

  // this cache will be checked if in-memory one returns undefined
  asyncCache: new RedisCache(ioRedis, {
    json: true, // this instructs loader to serialize passed objects as string and deserialize them back to objects
    ttlInMsecs: 1000 * 60 * 10,
  }),

  // data source will be generated from one or both provided data loading functions
  dataSourceGetOneFn: async (key: string) => {
    const results = await this.db('classifiers')
      .select('*')
      .where({
        id: parseInt(key),
      })
    return results[0]
  },
  dataSourceGetManyFn: (keys: string[]) => {
    return this.db('classifiers').select('*').whereIn('id', keys.map(parseInt))
  },
})

// If cache is empty, but there is data in the DB, after this operation is completed, both caches will be populated
const classifier = await loader.get('1')
```

## Loader API

Loader has the following config parameters:

- `throwIfUnresolved: boolean` - if true, error will be thrown if all data sources return `undefined`;
- `throwIfLoadError: boolean` - if true, error will be thrown if any Loader throws an error;
- `cacheUpdateErrorHandler: LoaderErrorHandler` - error handler to use when cache throws an error during update;
- `loadErrorHandler: LoaderErrorHandler` - error handler to use when non-last data source throws an error during data retrieval.

Loader provides following methods:

- `invalidateCacheFor(key: string): Promise<void>` - expunge all entries for given key from all caches of this Loader;
- `invalidateCacheForMany(keys: string[]): Promise<void>` - expunge all entries for given keys from all caches of this Loader;
- `invalidateCache(): Promise<void>` - expunge all entries from all caches of this Loader;
- `get(key: string, loadParams?: P): Promise<T>` - sequentially attempt to retrieve data for specified key from all caches and loaders, in an order in which those data sources passed to the Loader constructor.
- `getMany(keys: string[], idResolver: (entity: T) => string, loadParams?: P): Promise<T>` - sequentially attempt to retrieve data for specified keys from all caches and data sources, in an order in which those data sources were passed to the Loader constructor. Note that this retrieval mode doesn't support neither fetch deduplication nor the preemptive background refresh.

## Parametrized loading

Sometimes you need to pass additional parameters for loader in case it will need to refill the cache, such as JWT token (for external calls) or additional query parameters (for a DB call).
You can use optional parameter `loadParams` for that:

```ts
import type { DataSource } from 'layered-loader'

export type MyLoaderParams = {
  jwtToken: string
  entityId: string
}

class MyParametrizedDataSource implements DataSource<string, MyLoaderParams> {
  async get(_key: string, params?: MyLoaderParams): Promise<string | undefined | null> {
    if (!params) {
      throw new Error('Params were not passed')
    }

    const resolvedValue = await someResolutionLogic(params.entityId, params.jwtToken)
    return resolvedValue
  }
}

const loader = new Loader<string, MyLoaderParams>({
  inMemoryCache: IN_MEMORY_CACHE_CONFIG,
  dataSources: [new MyParametrizedDataSource()],
})
await operation.get('key', { jwtToken: 'someTokenValue', entityId: 'key' })
```

## Update notifications

It is possible to mostly rely on fast in-memory caches and still keep data in sync across multiple nodes in a distributed system. In order to achieve this, you need to use Notification Publisher/Consumer pair.
The way it works - whenever there is an invalidation event within the loader (`invalidate`, `invalidateFor` or `invalidatForGroup` methods are invoked), publisher sends a fanout notification to all subscribed consumers, and they invalidate their own caches as well.

Here is an example:

```ts
import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'
import { createNotificationPair, Loader } from 'layered-loader'

const redisOptions: RedisOptions = {
  host: 'localhost',
  port: 6379,
  password: 'sOmE_sEcUrE_pAsS',
}

export type User = {
  // some type
}

const redisPublisher = new Redis(redisOptions)
const redisConsumer = new Redis(redisOptions)
const redisCache = new Redis(redisOptions)

const { publisher: notificationPublisher, consumer: notificationConsumer } = createNotificationPair<User>({
  channel: 'user-cache-notifications',
  consumerRedis: redisConsumer,
  publisherRedis: redisPublisher,
})

const userLoader = new Loader({
  inMemoryCache: { ttlInMsecs: 1000 * 60 * 5 },
  asyncCache: new RedisCache<User>(redisCache, {
    ttlInMsecs: 1000 * 60 * 60,
  }),
  notificationConsumer,
  notificationPublisher,
})

await userLoader.init() // this will ensure that consumers have definitely finished registering on startup, but is not required

await userLoader.invalidateCacheFor('key') // this will transparently invalidate cache across all instances of your application
```

There is an equivalent for group loaders as well:

```ts
import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'
import { createGroupNotificationPair, GroupLoader } from 'layered-loader'

const redisOptions: RedisOptions = {
  host: 'localhost',
  port: 6379,
  password: 'sOmE_sEcUrE_pAsS',
}

export type User = {
  // some type
}

const redisPublisher = new Redis(redisOptions)
const redisConsumer = new Redis(redisOptions)
const redisCache = new Redis(redisOptions)

const { publisher: notificationPublisher, consumer: notificationConsumer } = createGroupNotificationPair<User>({
  channel: 'user-cache-notifications',
  consumerRedis: redisConsumer,
  publisherRedis: redisPublisher,
})

const userLoader = new GroupLoader({
  inMemoryCache: { ttlInMsecs: 1000 * 60 * 5 },
  asyncCache: new RedisCache<User>(redisCache, {
    ttlInMsecs: 1000 * 60 * 60,
  }),
  notificationConsumer,
  notificationPublisher,
})

await userLoader.init() // this will ensure that consumers have definitely finished registering on startup, but is not required

await userLoader.invalidateCacheFor('key', 'group') // this will transparently invalidate cache across all instances of your application
```

## Cache statistics

You can keep track of your in-memory cache usage is by using special cache type - `lru-object-statistics`:

```ts
import { HitStatisticsRecord, Loader } from 'layered-loader'

const record = new HitStatisticsRecord()
const operation = new Loader({
  inMemoryCache: {
    ttlInMsecs: 99999,
    cacheId: 'some cache',
    globalStatisticsRecord: record,
    cacheType: 'lru-object-statistics',
  },
})

operation.getInMemoryOnly('value')

expect(record.records).toEqual({
  'some cache': {
    '2023-05-20': {
      cacheSize: 100, // how many elements does cache currently have
      evictions: 5, // how many elements were evicted due to cache being at max capacity
      expirations: 0, // how many elements were removed during get due to their ttl being exceeded
      hits: 0, // how many times element was successfully retrieved from cache during get
      emptyHits: 0, // out of all hits, how many were null, undefined or ''?
      falsyHits: 0, // out of all hits, how many were falsy?
      misses: 1, // how many times element was not in cache or expired during get
      invalidateOne: 1, // how many times element was invalidated individually
      invalidateAll: 2, // how many times entire cache was invalidated
      sets: 0, // how many times new element was added
    },
  },
})
```

Note that statistics accumulation affects performance of the cache, and it is recommended
to only enable it temporarily, while conducting cache effectiveness analysis.

## Cache-only operations

Sometimes you may want to avoid implementing loader in the chain (e. g. when retrieval is too complex to be fit into a single key paradigm),
while still having a sequence of caches. In that case you can define a caching operation:

```ts
const cache = new ManualCache<string>({
  // this cache will be checked first
  inMemoryCache: {
    ttlInMsecs: 1000 * 60,
    maxItems: 100,
  },

  // this cache will be checked if in-memory one returns undefined
  asyncCache: new RedisCache(ioRedis, {
    json: true, // this instructs loader to serialize passed objects as string and deserialize them back to objects
    ttlInMsecs: 1000 * 60 * 10,
  }),
})

// this will populate all caches
await cache.set('1', 'someValue')

// If any of the caches are still populated at the moment of this operation, 'someValue' will propagate across all caches
const classifier = await cache.get('1')
```

Note that Loaders are generally recommended over ManualCaches, as they offer better performance: LoadingOperations deduplicate all the get requests that come during the window between checking the cache and populating it, while Caching Operation will resolve all of them to undefined after checking the cache, both increasing load on the cache, and also potentially invoking the loading logic multiple times.

### Forcing an update

In certain cases you may want to fetch fresh data from the datasource before invalidating the cache. In that case you should use the `forceRefresh` method:

```ts
// This will resolve the latest version of the data for the key "1", update async and inmemory caches and fire a NotificationPublisher invalidation command, if publisher is set  
await cache.forceRefresh('1')
```

### Forcing a specific value

In certain cases you may want to explicitly store a specific value in all of your caches layers. In that case you should use the `forceSetValue` method:

```ts
// This will set the value of all configured caches for the key "1" to a value "newValue", and fire a NotificationPublisher set value command, if publisher is set  
await cache.forceSetValue('1', 'newValue')
```

## Usage in high-performance systems

### Synchronous short-circuit

In case you are handling very heavy load and want to achieve highest possible performance, you can avoid asynchronous retrieval (and unnecessary Promise overhead) altogether in case there is a value already available in in-memory cache. Here is the example:

```ts
const loader = new Loader<MyValueType>({
  inMemoryCache: {
    // configuration here
  },

  // this cache will be checked if in-memory one returns undefined
  asyncCache: new RedisCache<MyValueType>(ioRedis, {
    // configuration here
  }),
  dataSources: [new MyDataSource()],
})

const cachedValue =
  // this very quickly checks if we have value in-memory
  loader.getInMemoryOnly('key') ||
  // if we don't, proceed with checking asynchronous cache and datasources
  (await loader.getAsyncOnly('key'))
```

Note that this will only work with truthy values. If you expect to get significant amount of falsy values (null for non-existing entries or 0/false), you should use an extended short-circuit syntax:

```ts
let cachedValue: MyValueType | undefined | null
cachedValue = loader.getInMemoryOnly('key')

if (cachedValue === undefined) {
  cachedValue = await loader.getAsyncOnly('key')
}
```

If you are unsure, whether you are caching significant amount of falsy or empty (null/empty string) values, you can enable cache statistics for discovering this data. See section "Cache statistics" for how to set that up.

### Preemptive background refresh

In case some of your datasource calls are very expensive, and you want to reduce response latency, you can start preemptively refreshing your cache in background while still serving not-yet-stale current data. In order to do so, you need to set parameter `ttlLeftBeforeRefreshInMsecs`.
For in-memory cache:

```ts
const operation = new Loader<string>({
  inMemoryCache: {
    cacheId: 'some-cache',
    ttlInMsecs: 1000 * 60,
    ttlLeftBeforeRefreshInMsecs: 1000 * 20, // this means that when there is a GET operation for the cache entry, and it has less than 20 seconds of TTL left, background refresh for this entry will start
  },
  // the rest of loader configuration
})
```

For Redis cache:

```ts
const asyncCache = new RedisCache<string>(redis, {
  ttlInMsecs: 1000 * 60,
  ttlLeftBeforeRefreshInMsecs: 1000 * 20,
}) // this means that when there is a GET operation for the cache entry, and it has less than 20 seconds of TTL left, background refresh for this entry will start
```

Note that there is overhead involved in performing refresh checks (especially for Redis). Always measure performance before and after enabling preemptive refresh in order to determine, whether it improves or worsens the performance of your system.
Bulk operations (`getMany()`) do not support preemptive background refresh.

## Group operations

ToDo

## Provided async caches

### RedisCache

`RedisCache` uses Redis for caching data, and is recommended for highly distributed systems. It requires an active instance of `ioredis`, and it does not perform any connection/disconnection operations on its own.
It has following configuration options:

- `prefix: string` - what prefix should be added to all keys in this cache. Used to differentiate among different groups of entities within single Redis DB (serving as a pseudo-table);
- `ttlInMsecs: number` - after how many milliseconds data will be considered stale and will no longer be accessible;
- `groupTtlInMsecs: number` - after how many milliseconds entire group will be considered stale and will no longer be accessible. For non-huge amount of groups (if you have less than a million, you have nothing to worry about) it is generally recommended not to set TTL, but if there is a huge amount of them, and more are added often, you may eventually run out of memory if you never expire groups, as you will keep accumulating their prefix identifiers in your Redis. Note that adding new entries to a group does not reset its TTL.";
- `json: boolean` - if false, all passed data will be sent to Redis and returned from it as-is. If true, it will be serialized using `JSON.stringify` and deserialized, using `JSON.parse`;
- `timeoutInMsecs?: number` - if set, Redis operations will automatically fail after specified execution threshold in milliseconds is exceeded. Next data source in the sequence will be used instead.
- `separator?: number` - What text should be used between different parts of the key prefix. Default is `':'`
- `ttlLeftBeforeRefreshInMsecs?: number` - if set within a Loader or GroupLoader, when remaining ttl is equal or lower to specified value, loading will be started in background, and all caches will be updated. It is recommended to set this value for heavy loaded system, to prevent requests from stalling while cache refresh is happening.
