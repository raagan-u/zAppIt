import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './Mopro.types';

type MoproModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class MoproModule extends NativeModule<MoproModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(MoproModule, 'MoproModule');
