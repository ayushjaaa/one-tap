import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shimmer, ShimmerCard } from '@/components/common/Shimmer';
import { useAppSelector } from '@/hooks/useAppSelector';
import { colors, radius, spacing, typography } from '@/theme';

export const HomeScreen: React.FC = () => {
  const user = useAppSelector(state => state.auth.user);
  const location = useAppSelector(state => state.location);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Hi {user?.name?.split(' ')[0]} 👋
            </Text>
            {location.city ? (
              <Text style={styles.location}>
                📍 {location.city}
                {location.state ? `, ${location.state}` : ''}
              </Text>
            ) : (
              <Text style={styles.location}>📍 Location unavailable</Text>
            )}
          </View>
          <View style={styles.avatar}>
            <Image
              source={require('@/assets/icons/img.png')}
              style={styles.avatarImg}
            />
          </View>
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            Welcome to <Text style={styles.heroAccent}>OneTap365</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Discover services, products, and investments — all in one place.
          </Text>
        </View>

        {/* Categories grid */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.grid}>
          <CategoryTile emoji="🛍️" label="Marketplace" />
          <CategoryTile emoji="🔧" label="Services" />
          <CategoryTile emoji="🏘️" label="Properties" />
          <CategoryTile emoji="💼" label="Jobs" />
        </View>

        {/* Recommended (shimmer placeholders for now) */}
        <Text style={styles.sectionTitle}>Recommended for you</Text>
        <ShimmerCard />
        <ShimmerCard />

        {/* Trending (shimmer rows) */}
        <Text style={styles.sectionTitle}>Trending nearby</Text>
        <View style={styles.row}>
          <Shimmer width="48%" height={140} borderRadius={radius.lg} />
          <Shimmer width="48%" height={140} borderRadius={radius.lg} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const CategoryTile: React.FC<{ emoji: string; label: string }> = ({
  emoji,
  label,
}) => {
  return (
    <View style={styles.tile}>
      <View style={styles.tileEmojiBox}>
        <Text style={styles.tileEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(43, 179, 42, 0.3)',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heroAccent: {
    color: colors.primary,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.base,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  tile: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tileEmojiBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(43, 179, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileEmoji: {
    fontSize: 28,
  },
  tileLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
});
