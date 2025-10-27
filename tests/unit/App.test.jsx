import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  it('renders the ClipForge heading', () => {
    render(<App />);
    expect(screen.getByText('ClipForge')).toBeInTheDocument();
  });
});

