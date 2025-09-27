import { NativeModule, requireNativeModule } from 'expo';

import { MoproModuleEvents } from './Mopro.types';

declare class MoproModule extends NativeModule<MoproModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MoproModule>('Mopro');
