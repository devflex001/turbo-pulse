/**
 * Circuit Breaker Pattern Implementation
 * Prevents hammering failing services by tracking failure rates
 */

export enum CircuitBreakerState {
    CLOSED = "CLOSED", // Normal operation
    OPEN = "OPEN", // Service is down, reject calls
    HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

export interface CircuitBreakerConfig {
    failureThreshold: number; // Number of failures before opening (e.g., 5)
    successThreshold: number; // Number of successes in HALF_OPEN before closing (e.g., 2)
    timeout: number; // Time in ms before transitioning to HALF_OPEN (e.g., 60000)
}

export class CircuitBreaker {
    private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime: number | null = null;
    private name: string;
    private config: CircuitBreakerConfig;

    constructor(
        name: string,
        config: Partial<CircuitBreakerConfig> = {}
    ) {
        this.name = name;
        this.config = {
            failureThreshold: config.failureThreshold ?? 5,
            successThreshold: config.successThreshold ?? 2,
            timeout: config.timeout ?? 60000,
        };
    }

    /**
     * Check if the circuit breaker is currently allowing requests
     */
    isOpen(): boolean {
        if (this.state === CircuitBreakerState.CLOSED) {
            return false;
        }

        if (this.state === CircuitBreakerState.OPEN) {
            // Check if timeout has passed to transition to HALF_OPEN
            if (
                this.lastFailureTime &&
                Date.now() - this.lastFailureTime > this.config.timeout
            ) {
                console.log(
                    `[CIRCUIT BREAKER ${this.name}] Transitioning to HALF_OPEN after ${this.config.timeout}ms`
                );
                this.state = CircuitBreakerState.HALF_OPEN;
                this.successCount = 0;
                return false; // Allow a test request
            }

            return true; // Circuit is still open
        }

        // HALF_OPEN state allows requests through
        return false;
    }

    /**
     * Record a successful call
     */
    recordSuccess(): void {
        console.log(
            `[CIRCUIT BREAKER ${this.name}] Success recorded (state: ${this.state})`
        );

        if (this.state === CircuitBreakerState.CLOSED) {
            this.failureCount = 0;
            return;
        }

        if (this.state === CircuitBreakerState.HALF_OPEN) {
            this.successCount++;
            console.log(
                `[CIRCUIT BREAKER ${this.name}] HALF_OPEN success count: ${this.successCount}/${this.config.successThreshold}`
            );

            if (this.successCount >= this.config.successThreshold) {
                console.log(
                    `[CIRCUIT BREAKER ${this.name}] Service recovered, transitioning to CLOSED`
                );
                this.state = CircuitBreakerState.CLOSED;
                this.failureCount = 0;
                this.successCount = 0;
                this.lastFailureTime = null;
            }
        }
    }

    /**
     * Record a failed call
     */
    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        console.log(
            `[CIRCUIT BREAKER ${this.name}] Failure recorded (count: ${this.failureCount}/${this.config.failureThreshold}, state: ${this.state})`
        );

        if (this.state === CircuitBreakerState.CLOSED) {
            if (this.failureCount >= this.config.failureThreshold) {
                console.log(
                    `[CIRCUIT BREAKER ${this.name}] Failure threshold reached, opening circuit`
                );
                this.state = CircuitBreakerState.OPEN;
                this.successCount = 0;
            }
        } else if (this.state === CircuitBreakerState.HALF_OPEN) {
            console.log(
                `[CIRCUIT BREAKER ${this.name}] Failure during HALF_OPEN, reopening circuit`
            );
            this.state = CircuitBreakerState.OPEN;
            this.successCount = 0;
        }
    }

    /**
     * Get current state information
     */
    getState(): {
        state: CircuitBreakerState;
        failureCount: number;
        successCount: number;
        isOpen: boolean;
    } {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            isOpen: this.isOpen(),
        };
    }

    /**
     * Reset the circuit breaker (for testing or manual intervention)
     */
    reset(): void {
        console.log(`[CIRCUIT BREAKER ${this.name}] Manual reset`);
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
    }
}

// Service-level circuit breakers
const kwikbetBreaker = new CircuitBreaker("KWIKBET", {
    failureThreshold: 3, // Open after 3 consecutive failures
    successThreshold: 2, // Close after 2 successful requests in HALF_OPEN
    timeout: 30000, // Try again after 30 seconds
});

export const circuitBreakers = {
    kwikbet: kwikbetBreaker,
};
