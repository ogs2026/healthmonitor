// Local, on-device replacements for the app builder's "platform-hooks" module.
//
// The original component was written against a hosted builder that injected
// useQuery / useMutation / useStorage / seedSampleRows / useCamera / useBluetooth.
// This file provides the same API backed by AsyncStorage (localStorage on web),
// expo-image-picker and Web Bluetooth, so the screens run unchanged.

import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';

// The picker returns files in a cache folder the OS may clear. On phones,
// copy each photo into the app's documents folder so it is kept.
function keepPhoto(uri) {
  if (Platform.OS === 'web') return Promise.resolve(uri);
  try {
    var folder = new Directory(Paths.document, 'health-photos');
    if (!folder.exists) folder.create({ intermediates: true });
    var extension = (uri.match(/\.[a-zA-Z0-9]+$/) || ['.jpg'])[0];
    var target = new File(folder, Date.now().toString(36) + extension);
    return Promise.resolve(new File(uri).copy(target)).then(function() { return target.uri; }, function() { return uri; });
  } catch (error) {
    return Promise.resolve(uri);
  }
}

function deleteKeptPhotos() {
  if (Platform.OS === 'web') return;
  try {
    var folder = new Directory(Paths.document, 'health-photos');
    if (folder.exists) folder.delete();
  } catch (error) {}
}

var KEY_PREFIX = 'hubble-health:';

// ---------------------------------------------------------------------------
// Tiny shared store: every key is loaded once, cached in memory, and every
// hook that reads it re-renders when it changes.
// ---------------------------------------------------------------------------
var cache = {};
var loaded = {};
var loading = {};
var listeners = {};

function emit(key) {
  (listeners[key] || []).forEach(function(listener) { listener(); });
}

function subscribe(key, listener) {
  listeners[key] = listeners[key] || [];
  listeners[key].push(listener);
  return function() {
    listeners[key] = (listeners[key] || []).filter(function(item) { return item !== listener; });
  };
}

function load(key) {
  if (loaded[key]) return Promise.resolve(cache[key]);
  if (!loading[key]) {
    loading[key] = AsyncStorage.getItem(KEY_PREFIX + key).then(function(raw) {
      // A write may have happened while we were reading; keep it.
      if (!loaded[key]) {
        cache[key] = raw == null ? undefined : JSON.parse(raw);
        loaded[key] = true;
      }
      emit(key);
      return cache[key];
    }).catch(function() {
      // Storage unavailable (e.g. private mode or a sandboxed frame):
      // keep working in memory for this session.
      loaded[key] = true;
      emit(key);
      return cache[key];
    });
  }
  return loading[key];
}

function write(key, value) {
  cache[key] = value;
  loaded[key] = true;
  emit(key);
  return AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify(value)).catch(function() {});
}

function useStoreKey(key) {
  var force = React.useReducer(function(n) { return n + 1; }, 0)[1];
  var errorState = React.useState(null);
  React.useEffect(function() {
    var unsubscribe = subscribe(key, force);
    load(key).catch(function(error) { errorState[1](error); });
    return unsubscribe;
  }, [key]);
  return { value: cache[key], ready: !!loaded[key], error: errorState[0] };
}

// Removes everything this app stored and resets every open screen.
export function clearAllData() {
  return AsyncStorage.getAllKeys().then(function(keys) {
    return AsyncStorage.multiRemove(keys.filter(function(key) { return key.indexOf(KEY_PREFIX) === 0; }));
  }).catch(function() {}).then(function() {
    deleteKeptPhotos();
    Object.keys(cache).forEach(function(key) {
      cache[key] = undefined;
      loaded[key] = true;
      emit(key);
    });
    // Keep the demo seed from coming back after a delete.
    write('meta:seeded', true);
  });
}

// ---------------------------------------------------------------------------
// useStorage(key, defaultValue) -> [value, setValue]
// setValue accepts a value or an updater function, like useState.
// ---------------------------------------------------------------------------
export function useStorage(key, defaultValue) {
  var entry = useStoreKey('kv:' + key);
  var value = entry.value === undefined ? defaultValue : entry.value;
  var setValue = React.useCallback(function(next) {
    var storeKey = 'kv:' + key;
    var previous = cache[storeKey] === undefined ? defaultValue : cache[storeKey];
    var resolved = typeof next === 'function' ? next(previous) : next;
    write(storeKey, resolved);
  }, [key]);
  return [value, setValue];
}

// ---------------------------------------------------------------------------
// Tables: useQuery / useMutation
// ---------------------------------------------------------------------------
function tableKey(table) { return 'table:' + table; }

function sortRows(rows, order) {
  if (!order || !order.column) return rows;
  var column = order.column;
  var direction = order.ascending === false ? -1 : 1;
  return rows.slice().sort(function(a, b) {
    var x = a[column];
    var y = b[column];
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return x < y ? -direction : x > y ? direction : 0;
  });
}

function matches(row, filter) {
  return Object.keys(filter || {}).every(function(field) { return row[field] === filter[field]; });
}

export function useQuery(table, filter, order) {
  var entry = useStoreKey(tableKey(table));
  var refreshState = React.useState(0);
  var rows = entry.value || [];
  var filterJson = JSON.stringify(filter || {});
  var orderJson = JSON.stringify(order || {});
  var data = React.useMemo(function() {
    return sortRows(rows.filter(function(row) { return matches(row, filter); }), order);
  }, [rows, filterJson, orderJson, refreshState[0]]);
  return {
    data: data,
    loading: !entry.ready,
    error: entry.error,
    refetch: function() {
      var key = tableKey(table);
      loaded[key] = false;
      loading[key] = null;
      load(key).catch(function() {});
      refreshState[1](function(n) { return n + 1; });
    }
  };
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useMutation(table, operation) {
  var key = tableKey(table);
  return {
    mutate: function(payload) {
      return load(key).then(function(current) {
        var rows = current || [];
        if (operation === 'insert') {
          var row = Object.assign({ id: newId(), created_at: new Date().toISOString() }, payload);
          return write(key, rows.concat([row])).then(function() { return row; });
        }
        if (operation === 'update') {
          var updated = null;
          var next = rows.map(function(item) {
            if (item.id !== payload.id) return item;
            updated = Object.assign({}, item, payload);
            return updated;
          });
          return write(key, next).then(function() { return updated; });
        }
        if (operation === 'delete') {
          return write(key, rows.filter(function(item) { return item.id !== payload.id; })).then(function() { return payload; });
        }
        throw new Error('Unsupported operation: ' + operation);
      });
    }
  };
}

// ---------------------------------------------------------------------------
// seedSampleRows: fills empty tables once, on first launch only.
// Resolves '@day(-4 14:11)' to that time, four days ago (local time).
// ---------------------------------------------------------------------------
function resolveDay(value) {
  if (typeof value !== 'string') return value;
  var match = value.match(/^@day\((-?\d+)(?:\s+(\d{1,2}):(\d{2}))?\)$/);
  if (!match) return value;
  var date = new Date();
  date.setDate(date.getDate() + Number(match[1]));
  date.setHours(match[2] ? Number(match[2]) : 12, match[3] ? Number(match[3]) : 0, 0, 0);
  return date.toISOString();
}

var seeded = false;
export function seedSampleRows(sample) {
  if (seeded) return;
  seeded = true;
  load('meta:seeded').then(function(done) {
    if (done) return;
    return Promise.all(Object.keys(sample).map(function(table) {
      return load(tableKey(table)).then(function(existing) {
        if (existing && existing.length) return;
        var rows = sample[table].map(function(row) {
          var copy = { id: newId() };
          Object.keys(row).forEach(function(field) { copy[field] = resolveDay(row[field]); });
          return copy;
        });
        return write(tableKey(table), rows);
      });
    })).then(function() { return write('meta:seeded', true); });
  }).catch(function() {});
}

// ---------------------------------------------------------------------------
// useCamera: takePhoto / pickImage -> { uri } | { cancelled: true } | { error }
// ---------------------------------------------------------------------------
export function useCamera() {
  var errorState = React.useState(null);
  var run = function(launch, requestPermission) {
    var permission = Platform.OS === 'web' ? Promise.resolve({ granted: true }) : requestPermission();
    return permission.then(function(result) {
      if (!result.granted) return { error: 'Permission was not granted' };
      return launch({ mediaTypes: ['images'], quality: 0.7 }).then(function(picked) {
        if (picked.canceled || !picked.assets || !picked.assets.length) return { cancelled: true };
        return keepPhoto(picked.assets[0].uri).then(function(uri) { return { uri: uri }; });
      });
    }).catch(function(error) {
      errorState[1](error.message);
      return { error: error.message || 'Camera unavailable' };
    });
  };
  return {
    error: errorState[0],
    takePhoto: function() { return run(ImagePicker.launchCameraAsync, ImagePicker.requestCameraPermissionsAsync); },
    pickImage: function() { return run(ImagePicker.launchImageLibraryAsync, ImagePicker.requestMediaLibraryPermissionsAsync); }
  };
}

// ---------------------------------------------------------------------------
// useBluetooth: device discovery.
// On web (Chrome/Edge) this opens the browser's Bluetooth device chooser.
// Native scanning needs a BLE library and a development build, so on iOS and
// Android it reports that scanning is not available yet.
// ---------------------------------------------------------------------------
export function useBluetooth() {
  var devicesState = React.useState([]);
  return {
    discoveredDevices: devicesState[0],
    requestEnable: function() {},
    scan: function() {
      var bluetooth = typeof navigator !== 'undefined' ? navigator.bluetooth : null;
      if (Platform.OS !== 'web' || !bluetooth) {
        return Promise.resolve({ error: 'Bluetooth scanning is not available on this device. On the web, use Chrome or Edge.' });
      }
      return bluetooth.requestDevice({ acceptAllDevices: true }).then(function(device) {
        devicesState[1](function(previous) {
          var others = previous.filter(function(item) { return item.id !== device.id; });
          return [{ id: device.id, name: device.name }].concat(others);
        });
        return { devices: [device] };
      }, function(error) {
        if (error && error.name === 'NotFoundError') return { error: 'No device was selected.' };
        return { error: (error && error.message) || 'Could not scan for nearby devices.' };
      });
    }
  };
}
