'use client';

import { useEffect, useState } from 'react';
import type { Props as JoyrideProps } from 'react-joyride';

export function JoyrideWrapper(props: JoyrideProps) {
  const [Component, setComponent] = useState<React.ComponentType<JoyrideProps> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Joyride = require('react-joyride').default as React.ComponentType<JoyrideProps>;
    setComponent(() => Joyride);
  }, []);

  if (!Component) return null;

  return <Component {...props} />;
}
