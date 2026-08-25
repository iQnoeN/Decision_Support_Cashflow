import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileUploader } from '../src/components/uploader/FileUploader';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('FileUploader Component', () => {
  it('renders upload dropzone instructions correctly', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <FileUploader />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Upload Bank Statement/i)).toBeInTheDocument();
    expect(screen.getByText(/Download CSV Template/i)).toBeInTheDocument();
  });
});
