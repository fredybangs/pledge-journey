import type { CampaignSettings, CampaignStats, Donation } from './types';

export const DEFAULT_ROUTE_MILESTONES = [
	{ id: 'freetown', distance: 0, label: 'Freetown' },
	// Milepost-style route estimates from Freetown, used for the default display.
	// These follow the local "Mile 91" naming convention rather than straight-line distances.
	{ id: 'jui', distance: 15, label: 'Jui' },
	{ id: 'waterloo', distance: 20, label: 'Waterloo' },
	{ id: 'masiaka', distance: 47, label: 'Masiaka' },
	{ id: 'bauya', distance: 64, label: 'Bauya' },
	{ id: 'yonibana', distance: 88, label: 'Yonibana' },
	{ id: 'mile-91', distance: 91, label: 'Mile 91' },
] as const;

export const DEFAULT_BEYOND_UNLOCKS = [
	{ id: 'welcome-packs', distance: 100, label: 'Welcome Packs' },
	{ id: 'meals-boost', distance: 110, label: 'Meals Boost' },
	{ id: 'learning-materials', distance: 125, label: 'Learning Materials' },
	{ id: 'recreation-kit', distance: 140, label: 'Recreation Kit' },
	{ id: 'transport-buffer', distance: 160, label: 'Transport Buffer' },
	{ id: 'future-programs', distance: 200, label: 'Future Programs' },
] as const;

export const DEFAULT_SETTINGS: CampaignSettings = {
	title: 'Road to Mile 91',
	organizer: 'Freetown District Youth Council',
	startPoint: 'Freetown Center',
	destination: 'Mile 91 Youth Camp',
	currency: 'Le',
	pledgeName: 'mile',
	costPerUnit: 20,
	targetDistance: 91,
	distanceUnit: 'mi',
	milestoneText: 'Every Le 20 sponsors one mile.',
	routeMilestones: [...DEFAULT_ROUTE_MILESTONES],
	beyondUnlocks: [...DEFAULT_BEYOND_UNLOCKS],
	quickAmounts: [20, 40, 100, 200, 500, 1000],
	displayTheme: 'sierra-leone',
};

export const CAMPAIGN_TEMPLATES = [
	{
		id: 'mile-91',
		label: 'Road to Mile 91',
		settings: DEFAULT_SETTINGS,
	},
	{
		id: 'blank',
		label: 'Blank journey',
		settings: {
			...DEFAULT_SETTINGS,
			title: 'New Pledge Journey',
			organizer: 'Your Organization',
			startPoint: 'Start',
			destination: 'Destination',
			targetDistance: 10,
			milestoneText: 'Every pledge moves the journey forward.',
			routeMilestones: [
				{ id: 'start', distance: 0, label: 'Start' },
				{ id: 'finish', distance: 10, label: 'Destination' },
			],
			beyondUnlocks: [{ id: 'stretch-goal', distance: 12, label: 'Stretch Goal' }],
		} satisfies CampaignSettings,
	},
	{
		id: 'walkathon',
		label: 'Walkathon',
		settings: {
			...DEFAULT_SETTINGS,
			title: 'Community Walkathon',
			startPoint: 'Start Line',
			destination: 'Finish Line',
			pledgeName: 'kilometer',
			distanceUnit: 'km',
			targetDistance: 25,
			milestoneText: 'Every pledge sponsors another kilometer.',
			routeMilestones: [
				{ id: 'start-line', distance: 0, label: 'Start Line' },
				{ id: 'checkpoint-1', distance: 5, label: 'Checkpoint 1' },
				{ id: 'halfway', distance: 12.5, label: 'Halfway' },
				{ id: 'checkpoint-2', distance: 20, label: 'Checkpoint 2' },
				{ id: 'finish-line', distance: 25, label: 'Finish Line' },
			],
			beyondUnlocks: [
				{ id: 'refreshments', distance: 30, label: 'Refreshments Boost' },
				{ id: 'community-kit', distance: 35, label: 'Community Kit' },
			],
		} satisfies CampaignSettings,
	},
	{
		id: 'school-drive',
		label: 'School drive',
		settings: {
			...DEFAULT_SETTINGS,
			title: 'School Support Drive',
			startPoint: 'Launch',
			destination: 'Full Support Goal',
			pledgeName: 'step',
			distanceUnit: 'mi',
			targetDistance: 100,
			milestoneText: 'Each pledge moves the school support goal forward.',
			routeMilestones: [
				{ id: 'launch', distance: 0, label: 'Launch' },
				{ id: 'books', distance: 25, label: 'Books' },
				{ id: 'uniforms', distance: 50, label: 'Uniforms' },
				{ id: 'meals', distance: 75, label: 'Meals' },
				{ id: 'goal', distance: 100, label: 'Goal' },
			],
			beyondUnlocks: [
				{ id: 'sports', distance: 120, label: 'Sports Materials' },
				{ id: 'future-term', distance: 150, label: 'Future Term Fund' },
			],
		} satisfies CampaignSettings,
	},
] as const;

export function formatMoney(amount: number, currency = 'Le') {
	return `${currency} ${amount.toLocaleString(undefined, {
		maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
	})}`;
}

export function formatNumber(value: number) {
	return value.toLocaleString(undefined, {
		minimumFractionDigits: value % 1 === 0 ? 0 : 1,
		maximumFractionDigits: 1,
	});
}

export function unitLabel(settings: CampaignSettings, plural = true) {
	if (settings.pledgeName.trim()) {
		if (!plural) return settings.pledgeName.trim();
		return settings.pledgeName.trim().endsWith('s')
			? settings.pledgeName.trim()
			: `${settings.pledgeName.trim()}s`;
	}

	return settings.distanceUnit === 'km' ? 'km' : plural ? 'miles' : 'mile';
}

export function formatDistance(distance: number, settings: CampaignSettings) {
	const suffix = settings.distanceUnit === 'km' ? 'km' : 'mi';
	return `${formatNumber(distance)} ${suffix}`;
}

export function donationToDistance(amount: number, settings: CampaignSettings) {
	return amount / settings.costPerUnit;
}

export function donationReceivedAmount(donation: Donation) {
	if (donation.status === 'cancelled' || donation.status === 'pledged') return 0;
	if (donation.status === 'received') return donation.amount;
	return Math.min(Math.max(donation.receivedAmount || 0, 0), donation.amount);
}

export function donationCommittedAmount(donation: Donation) {
	return donation.status === 'cancelled' ? 0 : donation.amount;
}

export function donorDisplayName(donation?: Donation) {
	if (!donation) return 'Supporter';
	if (donation.anonymous) return 'Anonymous supporter';
	return donation.donorName.trim() || 'Supporter';
}

export function sortDonations(donations: Donation[]) {
	return [...donations].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

export function calculateStats(
	donations: Donation[],
	settings: CampaignSettings,
): CampaignStats {
	const committed = donations.reduce((sum, item) => sum + donationCommittedAmount(item), 0);
	const received = donations.reduce((sum, item) => sum + donationReceivedAmount(item), 0);
	const pledged = Math.max(committed - received, 0);
	const cancelled = donations
		.filter((item) => item.status === 'cancelled')
		.reduce((sum, item) => sum + item.amount, 0);
	const distance = committed / settings.costPerUnit;
	const activeDonations = donations.filter((item) => item.status !== 'cancelled');

	return {
		committed,
		received,
		pledged,
		cancelled,
		distance,
		targetDistance: settings.targetDistance,
		percent: Math.min((distance / settings.targetDistance) * 100, 100),
		beyondDistance: Math.max(distance - settings.targetDistance, 0),
		remainingDistance: Math.max(settings.targetDistance - distance, 0),
		donorCount: activeDonations.length,
		latest: sortDonations(activeDonations)[0],
		outstandingPledgeCount: activeDonations.filter(
			(item) => item.status === 'pledged' || item.status === 'partially_received',
		).length,
	};
}
