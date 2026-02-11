import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
  it('renders without crashing', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('displays children content', () => {
    render(
      <Card>
        <h1>Title</h1>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies default status with transparent border', () => {
    const { container } = render(<Card>Default</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveClass('border-l-4', 'border-l-transparent');
  });

  it('applies success status with green border', () => {
    const { container } = render(<Card status="success">Success</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveClass('border-l-4', 'border-l-competent');
  });

  it('applies warning status with amber border', () => {
    const { container } = render(<Card status="warning">Warning</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveClass('border-l-4', 'border-l-warning');
  });

  it('applies error status with red border', () => {
    const { container } = render(<Card status="error">Error</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveClass('border-l-4', 'border-l-critical');
  });

  it('applies base styling classes', () => {
    const { container } = render(<Card>Base styles</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveClass('bg-surface', 'rounded-lg', 'shadow-sm', 'p-4');
  });

  it('accepts and applies custom className', () => {
    const { container } = render(<Card className="custom-class">Custom</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    const { container } = render(<Card data-testid="custom-card">Content</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveAttribute('data-testid', 'custom-card');
  });

  it('combines custom className with default classes', () => {
    const { container } = render(
      <Card status="success" className="mt-4 extra-class">
        Combined
      </Card>
    );
    const card = container.querySelector('div');
    expect(card).toHaveClass('bg-surface', 'border-l-competent', 'mt-4', 'extra-class');
  });
});
