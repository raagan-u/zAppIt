import { requireNativeView } from 'expo';
import * as React from 'react';

import { MoproViewProps } from './Mopro.types';

const NativeView: React.ComponentType<MoproViewProps> =
  requireNativeView('Mopro');

export default function MoproView(props: MoproViewProps) {
  return <NativeView {...props} />;
}
