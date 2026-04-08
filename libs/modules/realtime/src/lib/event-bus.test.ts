import { EventBus } from './event-bus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('on', () => {
    it('should subscribe to an event', () => {
      const handler = jest.fn();
      eventBus.on('test-event', handler);
      eventBus.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple handlers for the same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should allow subscribing to multiple different events', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('event1', handler1);
      eventBus.on('event2', handler2);

      eventBus.emit('event1', { data: 'test1' });
      eventBus.emit('event2', { data: 'test2' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test1' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test2' });
    });
  });

  describe('off', () => {
    it('should unsubscribe from an event', () => {
      const handler = jest.fn();
      eventBus.on('test-event', handler);
      eventBus.off('test-event', handler);
      eventBus.emit('test-event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove the specific handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.off('test-event', handler1);
      eventBus.emit('test-event', { data: 'test' });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle unsubscribing from non-existent event', () => {
      const handler = jest.fn();
      expect(() => {
        eventBus.off('non-existent', handler);
      }).not.toThrow();
    });

    it('should handle unsubscribing non-existent handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('test-event', handler1);
      expect(() => {
        eventBus.off('test-event', handler2);
      }).not.toThrow();
    });
  });

  describe('emit', () => {
    it('should emit event to all subscribers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.on('test-event', handler3);

      eventBus.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
      expect(handler3).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle emitting to event with no subscribers', () => {
      expect(() => {
        eventBus.emit('non-existent', { data: 'test' });
      }).not.toThrow();
    });

    it('should pass different data types correctly', () => {
      const handler = jest.fn();
      eventBus.on('test-event', handler);

      // String
      eventBus.emit('test-event', 'string data');
      expect(handler).toHaveBeenCalledWith('string data');

      // Number
      eventBus.emit('test-event', 42);
      expect(handler).toHaveBeenCalledWith(42);

      // Object
      eventBus.emit('test-event', { key: 'value' });
      expect(handler).toHaveBeenCalledWith({ key: 'value' });

      // Array
      eventBus.emit('test-event', [1, 2, 3]);
      expect(handler).toHaveBeenCalledWith([1, 2, 3]);

      // Null
      eventBus.emit('test-event', null);
      expect(handler).toHaveBeenCalledWith(null);

      // Undefined
      eventBus.emit('test-event', undefined);
      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should handle errors in event handlers gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const successHandler = jest.fn();

      eventBus.on('test-event', errorHandler);
      eventBus.on('test-event', successHandler);

      eventBus.emit('test-event', { data: 'test' });

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in event handler for test-event:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should continue executing other handlers when one throws', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler1 = jest.fn();
      const handler2 = jest.fn(() => {
        throw new Error('Handler 2 error');
      });
      const handler3 = jest.fn();

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.on('test-event', handler3);

      eventBus.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
      expect(handler3).toHaveBeenCalledWith({ data: 'test' });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('once', () => {
    it('should subscribe to event that fires only once', () => {
      const handler = jest.fn();
      eventBus.once('test-event', handler);

      eventBus.emit('test-event', { data: 'test1' });
      eventBus.emit('test-event', { data: 'test2' });
      eventBus.emit('test-event', { data: 'test3' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'test1' });
    });

    it('should automatically unsubscribe after first emission', () => {
      const handler = jest.fn();
      eventBus.once('test-event', handler);

      eventBus.emit('test-event', { data: 'test1' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Verify handler is removed
      eventBus.emit('test-event', { data: 'test2' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should work alongside regular on() subscriptions', () => {
      const onceHandler = jest.fn();
      const regularHandler = jest.fn();

      eventBus.once('test-event', onceHandler);
      eventBus.on('test-event', regularHandler);

      eventBus.emit('test-event', { data: 'test1' });
      eventBus.emit('test-event', { data: 'test2' });

      expect(onceHandler).toHaveBeenCalledTimes(1);
      expect(regularHandler).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple once() subscriptions', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.once('test-event', handler1);
      eventBus.once('test-event', handler2);

      eventBus.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      eventBus.emit('test-event', { data: 'test2' });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration scenarios', () => {
    it('should handle connection status events', () => {
      const statusHandler = jest.fn();

      eventBus.on('connection:status', statusHandler);

      eventBus.emit('connection:status', { status: 'connected' });
      eventBus.emit('connection:status', { status: 'disconnected' });
      eventBus.emit('connection:status', { status: 'reconnecting' });

      expect(statusHandler).toHaveBeenCalledTimes(3);
      expect(statusHandler).toHaveBeenNthCalledWith(1, { status: 'connected' });
      expect(statusHandler).toHaveBeenNthCalledWith(2, { status: 'disconnected' });
      expect(statusHandler).toHaveBeenNthCalledWith(3, { status: 'reconnecting' });
    });

    it('should handle listener events', () => {
      const addedHandler = jest.fn();
      const removedHandler = jest.fn();

      eventBus.on('listener:added', addedHandler);
      eventBus.on('listener:removed', removedHandler);

      eventBus.emit('listener:added', { listener: { userId: '1', trackId: 'track1' } });
      eventBus.emit('listener:removed', { userId: '1' });

      expect(addedHandler).toHaveBeenCalledWith({ listener: { userId: '1', trackId: 'track1' } });
      expect(removedHandler).toHaveBeenCalledWith({ userId: '1' });
    });

    it('should handle game events', () => {
      const gameStartHandler = jest.fn();
      const roundStartHandler = jest.fn();
      const gameEndHandler = jest.fn();

      eventBus.on('game:started', gameStartHandler);
      eventBus.on('game:round-start', roundStartHandler);
      eventBus.once('game:ended', gameEndHandler);

      eventBus.emit('game:started', { roomId: 'room1' });
      eventBus.emit('game:round-start', { round: 1 });
      eventBus.emit('game:round-start', { round: 2 });
      eventBus.emit('game:ended', { finalScores: { player1: 100 } });
      eventBus.emit('game:ended', { finalScores: { player1: 200 } });

      expect(gameStartHandler).toHaveBeenCalledTimes(1);
      expect(roundStartHandler).toHaveBeenCalledTimes(2);
      expect(gameEndHandler).toHaveBeenCalledTimes(1); // once() should only fire once
    });

    it('should support cleanup pattern', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      // Subscribe
      eventBus.on('event1', handler1);
      eventBus.on('event2', handler2);
      eventBus.on('event3', handler3);

      // Emit
      eventBus.emit('event1', {});
      eventBus.emit('event2', {});
      eventBus.emit('event3', {});

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      // Cleanup
      eventBus.off('event1', handler1);
      eventBus.off('event2', handler2);
      eventBus.off('event3', handler3);

      // Emit again
      eventBus.emit('event1', {});
      eventBus.emit('event2', {});
      eventBus.emit('event3', {});

      // Should still be 1 (not called again)
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });
  });
});
