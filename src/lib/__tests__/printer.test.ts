import { describe, it, expect } from 'vitest';
import { PrinterDriver } from '../printer-driver';

describe('PrinterDriver', () => {
  const config = {
    name: 'Test Printer',
    model: 'TEST-1000',
    ipAddress: '127.0.0.1',
    port: 9100
  };

  it('should initialize with config', () => {
    const printer = new PrinterDriver(config);
    expect(printer.getStatus()).toEqual({
      status: 'ready',
      queue: 0
    });
  });

  it('should handle print jobs', async () => {
    const printer = new PrinterDriver(config);
    const jobId = await printer.print('test data');
    expect(typeof jobId).toBe('string');
    expect(jobId).toHaveLength(36); // UUID length
  });
});