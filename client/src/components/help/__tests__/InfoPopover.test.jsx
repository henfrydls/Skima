import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoPopover from '../InfoPopover';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

describe('InfoPopover', () => {
  it('renders trigger button with HelpCircle icon', () => {
    render(
      <InfoPopover title="Test Title">
        Test content
      </InfoPopover>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Test Title/i });
    expect(button).toBeInTheDocument();
  });

  it('does not show popover initially', () => {
    render(
      <InfoPopover title="Test Title">
        Test content
      </InfoPopover>
    );

    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('shows popover when trigger button is clicked', () => {
    render(
      <InfoPopover title="Test Title">
        Test content
      </InfoPopover>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Test Title/i });
    fireEvent.click(button);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('hides popover when trigger button is clicked again', () => {
    render(
      <InfoPopover title="Test Title">
        Test content
      </InfoPopover>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Test Title/i });

    // Open
    fireEvent.click(button);
    expect(screen.getByText('Test content')).toBeInTheDocument();

    // Close
    fireEvent.click(button);
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('closes popover when clicking outside', () => {
    render(
      <div>
        <InfoPopover title="Test Title">
          Test content
        </InfoPopover>
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Test Title/i });
    fireEvent.click(button);

    expect(screen.getByText('Test content')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('closes popover when Escape key is pressed', () => {
    render(
      <InfoPopover title="Test Title">
        Test content
      </InfoPopover>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Test Title/i });
    fireEvent.click(button);

    expect(screen.getByText('Test content')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('renders JSX content correctly', () => {
    render(
      <InfoPopover title="Complex Content">
        <div>
          <strong>Bold text</strong>
          <p>Paragraph text</p>
        </div>
      </InfoPopover>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Complex Content/i });
    fireEvent.click(button);

    expect(screen.getByText('Bold text')).toBeInTheDocument();
    expect(screen.getByText('Paragraph text')).toBeInTheDocument();
  });

  it('applies custom className to trigger button', () => {
    const { container } = render(
      <InfoPopover title="Test" className="custom-class">
        Content
      </InfoPopover>
    );

    const button = container.querySelector('.custom-class');
    expect(button).toBeInTheDocument();
  });

  it('popover has tooltip role for accessibility', () => {
    render(
      <InfoPopover title="Test Title">
        Test content
      </InfoPopover>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Test Title/i });
    fireEvent.click(button);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('sets aria-expanded attribute correctly', () => {
    render(
      <InfoPopover title="Test Title">
        Test content
      </InfoPopover>
    );

    const button = screen.getByRole('button', { name: /Ayuda: Test Title/i });

    // Initially collapsed
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // After click, expanded
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
