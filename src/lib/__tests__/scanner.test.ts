import { describe, it, expect } from 'vitest';
import { ScannerDriver } from '../printer-driver';

describe('ScannerDriver', () => {
  const config = {
    deviceId: 'TEST-SCANNER-1',
    resolution: 300,
    colorMode: 'color' as const
  };

  it('should initialize with config', () => {
    const scanner = new ScannerDriver(config);
    expect(scanner.getStatus()).toEqual({
      status: 'ready',
      ready: true
    });
  });

  it('should perform scans', async () => {
    const scanner = new ScannerDriver(config);
    const result = await scanner.scan();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('data');
    expect(typeof result.id).toBe('string');
    expect(typeof result.data).toBe('string');
  });
});