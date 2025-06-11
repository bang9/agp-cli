import chalk from 'chalk';
import ora from 'ora';

interface LoggerOptions {
  verbose?: boolean;
  silent?: boolean;
}

class Logger {
  private options: LoggerOptions;
  private currentProgress: string = '';
  private isProgressActive: boolean = false;

  constructor(options: LoggerOptions = {}) {
    this.options = options;
  }

  /**
   * Print important messages that should always be visible
   */
  info(message: string): void {
    this.clearProgress();
    console.log(chalk.blue(message));
  }

  success(message: string): void {
    this.clearProgress();
    console.log(chalk.green(`✓ ${message}`));
  }

  warning(message: string): void {
    this.clearProgress();
    console.log(chalk.yellow(`! ${message}`));
  }

  error(message: string): void {
    this.clearProgress();
    console.log(chalk.red(`✗ ${message}`));
  }

  /**
   * Show inline progress that gets replaced on next update
   */
  progress(message: string): void {
    if (this.options.silent) return;

    this.clearProgress();
    this.currentProgress = `⠋ ${message}...`;
    process.stdout.write(chalk.gray(this.currentProgress));
    this.isProgressActive = true;
  }

  /**
   * Complete current progress and show final result
   */
  progressDone(message?: string): void {
    if (this.options.silent) return;

    this.clearProgress();
    if (message) {
      console.log(chalk.gray(`✓ ${message}`));
    }
    this.isProgressActive = false;
  }

  /**
   * Show verbose/debug information (only if verbose mode is enabled)
   */
  debug(message: string): void {
    if (!this.options.verbose || this.options.silent) return;

    this.clearProgress();
    console.log(chalk.dim(message));
  }

  /**
   * Show step information (slightly less prominent than info)
   */
  step(message: string): void {
    this.clearProgress();
    console.log(chalk.cyan(`→ ${message}`));
  }

  /**
   * Clear current progress line
   */
  clearProgress(): void {
    if (this.isProgressActive && this.currentProgress) {
      // Calculate the actual display length (excluding emoji which might be 2 chars)
      const displayLength = this.currentProgress.length + 2; // +2 for emoji
      process.stdout.write('\r' + ' '.repeat(displayLength) + '\r');
      this.isProgressActive = false;
      this.currentProgress = '';
    }
  }

  /**
   * Start a multi-step operation
   */
  startGroup(title: string): void {
    this.clearProgress();
    console.log(chalk.bold.blue(`\n${title}`));
  }

  /**
   * End a multi-step operation
   */
  endGroup(message?: string): void {
    this.clearProgress();
    if (message) {
      console.log(chalk.bold.green(`${message}\n`));
    } else {
      console.log('');
    }
  }

  /**
   * Create a spinner-like effect for long operations
   */
  async withSpinner<T>(message: string, operation: () => Promise<T>): Promise<T> {
    if (this.options.silent) {
      return await operation();
    }

    const spinner = ora(message).start();

    try {
      const result = await operation();
      spinner.succeed(message);
      return result;
    } catch (error) {
      spinner.fail(message);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };

// Export convenience functions
export const createLogger = (options: LoggerOptions) => new Logger(options);
