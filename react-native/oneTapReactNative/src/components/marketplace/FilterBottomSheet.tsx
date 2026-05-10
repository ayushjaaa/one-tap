import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { colors, fontSize, layout, radius, spacing, typography } from '@/theme';

export interface FilterOption {
  key: string;
  label: string;
}

export interface FilterSection {
  title: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  sections: FilterSection[];
  selected: Record<string, string[]>;
  onChange: (sectionTitle: string, optionKey: string) => void;
  onApply: () => void;
  onReset?: () => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  sections,
  selected,
  onChange,
  onApply,
  onReset,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filters</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <X size={layout.iconSize.md} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {sections.map(section => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.chipRow}>
                    {section.options.map(opt => {
                      const isSelected =
                        selected[section.title]?.includes(opt.key) ?? false;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => onChange(section.title, opt.key)}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                        >
                          {isSelected ? (
                            <Check size={layout.iconSize.sm} color={colors.white} />
                          ) : null}
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              {onReset ? (
                <Pressable onPress={onReset} style={styles.resetBtn}>
                  <Text style={styles.resetText}>Reset</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onApply} style={styles.applyBtn}>
                <Text style={styles.applyText}>Apply</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '85%',
  },
  safeArea: {
    flex: 0,
  },
  handle: {
    alignSelf: 'center',
    width: layout.sheetHandleWidth,
    height: layout.sheetHandleHeight,
    borderRadius: radius.xs,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: layout.closeButton,
    height: layout.closeButton,
    borderRadius: layout.closeButton / 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  bodyContent: {
    paddingBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    flex: 1,
    height: layout.buttonHeightMd,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    height: layout.buttonHeightMd,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '700',
  },
});
