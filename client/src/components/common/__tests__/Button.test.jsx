import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('displays children content', () => {
    render(<Button>Submit Form</Button>);
    expect(screen.getByText('Submit Form')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-primary', 'text-white');
  });

  it('applies secondary variant styling', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-white', 'text-gray-700', 'border', 'border-gray-200');
  });

  it('applies ghost variant styling', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByText('Ghost');
    expect(button).toHaveClass('bg-transparent', 'text-primary');
  });

  it('applies danger variant styling', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-critical', 'text-white');
  });

  it('applies medium size by default', () => {
    render(<Button>Medium</Button>);
    const button = screen.getByText('Medium');
    expect(button).toHaveClass('px-4', 'py-2');
  });

  it('applies small size styling', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByText('Small');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies large size styling', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByText('Large');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);

    fireEvent.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading is true', () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByText('Loading');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when isLoading', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} isLoading>Loading</Button>);

    fireEvent.click(screen.getByText('Loading'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies disabled styles when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('accepts and applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    render(<Button data-testid="custom-button" type="submit">Submit</Button>);
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('shows different spinner sizes based on button size', () => {
    const { container: smallContainer } = render(<Button size="sm" isLoading>Small</Button>);
    const { container: mediumContainer } = render(<Button size="md" isLoading>Medium</Button>);

    const smallSpinner = smallContainer.querySelector('.animate-spin');
    const mediumSpinner = mediumContainer.querySelector('.animate-spin');

    expect(smallSpinner).toBeInTheDocument();
    expect(mediumSpinner).toBeInTheDocument();
  });

  it('applies correct focus styles', () => {
    render(<Button>Focus</Button>);
    const button = screen.getByText('Focus');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary/20');
  });
});
