import * as React from 'react';

import { MoproViewProps } from './Mopro.types';

export default function MoproView(props: MoproViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
