import type { Meta, StoryObj } from '@storybook/react';
import { KpiCard } from './KpiCard';
import { DollarSign, Flame, Clock } from 'lucide-react';

const meta: Meta<typeof KpiCard> = {
  title: 'UI/KpiCard',
  component: KpiCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof KpiCard>;

export className: Story = {
  args: {
    title: 'Current Cash Balance',
    value: '$145,800',
    subtitle: 'Available liquid funds',
    change: 4.2,
    icon: DollarSign,
    badgeText: 'Healthy',
    badgeType: 'success',
  },
};

export const BurnRate: Story = {
  args: {
    title: '30-Day Cash Burn Rate',
    value: '$84,500',
    subtitle: 'Operating expenses burn',
    change: -2.1,
    icon: Flame,
    iconBgColor: 'bg-rose-500/15',
    iconTextColor: 'text-rose-400',
    badgeText: 'Normal',
    badgeType: 'neutral',
  },
};

export const EstimatedRunway: Story = {
  args: {
    title: 'Estimated Runway',
    value: '48 Days',
    subtitle: 'Days of operation remaining',
    change: 6.0,
    icon: Clock,
    badgeText: 'Low Risk',
    badgeType: 'success',
  },
};
