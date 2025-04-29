import figlet from 'figlet';

export const showStartupMessage = (serviceName: string): Promise<void> =>
  new Promise((resolve) => {
    if (process.env.NODE_ENV === 'development') {
      figlet.text(serviceName, (_error: unknown, result: unknown) => {
        console.log('\x1b[1m\x1b[32m%s\x1b[0m', result);
        figlet.text(
          'Service started',
          { font: 'Small' },
          (_error2, result2) => {
            console.log('\x1b[35m%s\x1b[0m', result2);
            resolve();
          },
        );
      });
    } else {
      resolve();
    }
  });
