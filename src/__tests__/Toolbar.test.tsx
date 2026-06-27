import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Toolbar } from '../components/Toolbar';

describe('Toolbar', () => {
  const buttons = [
    { label: 'Ctrl+C', sequence: '\x03' },
    { label: 'Tab', sequence: '\x09' },
    { label: '↑', sequence: '\x1b[A' },
    { label: '↓', sequence: '\x1b[B' },
    { label: 'Esc', sequence: '\x1b' },
    { label: 'Enter', sequence: '\r' },
  ];

  it('renders all six buttons', async () => {
    const onSend = jest.fn();
    const { getByText } = await render(<Toolbar onSend={onSend} />);

    for (const { label } of buttons) {
      expect(getByText(label)).toBeTruthy();
    }
  });

  it.each(buttons)(
    'sends correct sequence when $label is tapped',
    async ({ label, sequence }) => {
      const onSend = jest.fn();
      const { getByText } = await render(<Toolbar onSend={onSend} />);

      fireEvent.press(getByText(label));

      expect(onSend).toHaveBeenCalledWith(sequence);
    },
  );

  it('uses theme background color', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await render(<Toolbar onSend={onSend} />);

    const container = getByTestId('toolbar');
    expect(container.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#0d0d0d',
      }),
    );
  });
});
