import test from 'node:test';
import assert from 'node:assert/strict';
import { getViewFromPath, getPathForRole } from './routing.js';

test('maps admin paths to the admin view', () => {
  assert.equal(getViewFromPath('/admin'), 'admin');
  assert.equal(getPathForRole('admin'), '/admin');
});

test('maps hr paths to the hr view', () => {
  assert.equal(getViewFromPath('/hr'), 'hr');
  assert.equal(getPathForRole('hr'), '/hr');
});

test('falls back to login for unknown paths', () => {
  assert.equal(getViewFromPath('/unknown'), 'login');
});
