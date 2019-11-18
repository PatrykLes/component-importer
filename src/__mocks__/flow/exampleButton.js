// @flow
import React from 'react';

import type { Data } from './types';

type Props = {
  data: Data,
};

function Button(props: Props) {
  return (
    <button>
      Hello
    </button>
  );
}

Button.displayName = 'Plasma@Button';

export default Button;
