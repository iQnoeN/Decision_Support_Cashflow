import type { Meta, StoryObj } from '@storybook/react';
import { RiskGauge } from './RiskGauge';

const meta: Meta<typeof RiskGauge> = {
  title: 'UI/RiskGauge',
  component: RiskGauge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RiskGauge>;

export const Stable: Story = {
  args: {
    score: 82.5,
    risk: 'Stable',
    runwayDays: 48,
  },
};

export const ModerateRisk: Story = {
  args: {
    score: 55.0,
    risk: 'Moderate Risk',
    runwayDays: 24,
  },
};

export const HighRisk: Story = {
  args: {
    score: 22.0,
    risk: 'High Risk',
    runwayDays: 9,
  },
};
