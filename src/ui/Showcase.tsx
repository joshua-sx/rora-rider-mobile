/**
 * Design System Showcase
 *
 * Run this screen to see all components in action.
 * Useful for development and design review.
 *
 * Usage:
 * Import and render in a screen:
 *   import { Showcase } from '@/src/ui/Showcase';
 *   export default function ShowcaseScreen() {
 *     return <Showcase />;
 *   }
 */

import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Text,
  Button,
  Input,
  SearchInput,
  Card,
  ListItem,
  Avatar,
  Badge,
  Divider,
  Skeleton,
  EmptyState,
  ErrorState,
  space,
  colors,
  radius,
} from "./index";

export function Showcase() {
  const [inputValue, setInputValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  return (
    <ScrollView
      contentContainerStyle={{
        padding: space[4],
        gap: space[6],
        paddingBottom: space[8],
      }}
    >
      {/* Header */}
      <Box style={{ gap: space[2] }}>
        <Text variant="title">Rora UI Design System</Text>
        <Text variant="sub" muted>
          A Dieter Rams-inspired component library
        </Text>
      </Box>

      {/* Typography */}
      <Section title="Typography">
        <Text variant="title">Title (20px / 26px)</Text>
        <Text variant="body">Body text (16px / 22px)</Text>
        <Text variant="sub">Subtitle (14px / 20px)</Text>
        <Text variant="cap">Caption (12px / 16px)</Text>
        <Text variant="body" muted>
          Muted text variant
        </Text>
      </Section>

      {/* Colors */}
      <Section title="Colors">
        <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
          <ColorSwatch label="Primary" color={colors.primary} />
          <ColorSwatch label="Danger" color={colors.danger} />
          <ColorSwatch label="Warning" color={colors.warning} />
          <ColorSwatch label="Success" color={colors.success} />
          <ColorSwatch label="Text" color={colors.text} />
          <ColorSwatch label="Muted" color={colors.textMuted} />
          <ColorSwatch label="Border" color={colors.border} />
          <ColorSwatch label="Surface" color={colors.surface} />
        </Box>
      </Section>

      {/* Spacing */}
      <Section title="Spacing (8px grid)">
        <Box style={{ gap: space[2] }}>
          <SpacingExample size={space[1]} label="space[1] (4px)" />
          <SpacingExample size={space[2]} label="space[2] (8px)" />
          <SpacingExample size={space[3]} label="space[3] (12px)" />
          <SpacingExample size={space[4]} label="space[4] (16px)" />
          <SpacingExample size={space[6]} label="space[6] (24px)" />
        </Box>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <Button label="Primary Button" variant="primary" onPress={() => {}} />
        <Button label="Secondary Button" variant="secondary" onPress={() => {}} />
        <Button label="Tertiary Button" variant="tertiary" onPress={() => {}} />
        <Button label="Danger Button" variant="danger" onPress={() => {}} />
        <Button label="Disabled Button" disabled onPress={() => {}} />
        <Button label="Loading Button" loading onPress={() => {}} />
        <Button
          label="Not Full Width"
          variant="secondary"
          fullWidth={false}
          onPress={() => {}}
        />
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <Input
          label="Default Input"
          placeholder="Enter text"
          value={inputValue}
          onChangeText={setInputValue}
        />
        <Input
          label="With Error"
          placeholder="Enter email"
          value=""
          error="This field is required"
        />
        <Input label="Disabled Input" placeholder="Disabled" editable={false} />
        <SearchInput
          placeholder="Search..."
          value={searchValue}
          onChangeText={setSearchValue}
          icon={<Ionicons name="search" size={20} color={colors.textMuted} />}
        />
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <Card>
          <Text variant="body">
            This is a card. Use it to group related information.
          </Text>
        </Card>
        <Card>
          <Text variant="title">Card with Title</Text>
          <Divider style={{ marginVertical: space[3] }} />
          <Text variant="body">
            Cards have consistent padding and border radius.
          </Text>
        </Card>
      </Section>

      {/* List Items */}
      <Section title="List Items">
        <Card>
          <ListItem
            title="Simple List Item"
            subtitle="With subtitle"
            onPress={() => {}}
          />
          <ListItem
            title="With Avatar"
            subtitle="Leading element"
            leading={<Avatar initials="JD" size="sm" />}
            onPress={() => {}}
          />
          <ListItem
            title="With Badge"
            subtitle="Trailing element"
            leading={<Avatar initials="AB" size="sm" />}
            trailing={<Badge label="New" variant="success" />}
            onPress={() => {}}
          />
          <ListItem
            title="With Chevron"
            subtitle="Navigation indicator"
            trailing={
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            }
            onPress={() => {}}
          />
        </Card>
      </Section>

      {/* Avatars */}
      <Section title="Avatars">
        <Box style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
          <Box style={{ alignItems: "center", gap: space[1] }}>
            <Avatar initials="SM" size="sm" />
            <Text variant="cap" muted>
              Small
            </Text>
          </Box>
          <Box style={{ alignItems: "center", gap: space[1] }}>
            <Avatar initials="MD" size="md" />
            <Text variant="cap" muted>
              Medium
            </Text>
          </Box>
          <Box style={{ alignItems: "center", gap: space[1] }}>
            <Avatar initials="LG" size="lg" />
            <Text variant="cap" muted>
              Large
            </Text>
          </Box>
        </Box>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
          <Badge label="Default" variant="default" />
          <Badge label="Success" variant="success" />
          <Badge label="Danger" variant="danger" />
          <Badge label="Warning" variant="warning" />
        </Box>
      </Section>

      {/* Dividers */}
      <Section title="Dividers">
        <Card>
          <Text variant="body">Section 1</Text>
          <Divider style={{ marginVertical: space[3] }} />
          <Text variant="body">Section 2</Text>
        </Card>
      </Section>

      {/* Skeletons */}
      <Section title="Loading (Skeletons)">
        <Skeleton width="100%" height={52} borderRadius={radius.md} />
        <Skeleton width="100%" height={100} borderRadius={radius.lg} />
        <Box style={{ flexDirection: "row", gap: space[2] }}>
          <Skeleton width={60} height={60} borderRadius={30} />
          <Box style={{ flex: 1, gap: space[2] }}>
            <Skeleton width="80%" height={20} />
            <Skeleton width="60%" height={16} />
          </Box>
        </Box>
      </Section>

      {/* Empty State */}
      <Section title="Empty State">
        <Card>
          <EmptyState
            message="No items found"
            actionLabel="Add Item"
            onAction={() => {}}
            icon={<Ionicons name="add-circle-outline" size={48} color={colors.textMuted} />}
          />
        </Card>
      </Section>

      {/* Error State */}
      <Section title="Error State">
        <Card>
          <ErrorState
            title="Connection Failed"
            message="Check your internet connection and try again."
            actionLabel="Retry"
            onAction={() => {}}
          />
        </Card>
      </Section>

      {/* Interactive Example */}
      <Section title="Interactive Example">
        <Card>
          <Text variant="title">Login Form</Text>
          <Box style={{ marginTop: space[4], gap: space[4] }}>
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <Input
              label="Password"
              placeholder="Enter password"
              secureTextEntry
            />
            <Button label="Sign In" onPress={() => {}} />
            <Button
              label="Forgot Password?"
              variant="tertiary"
              onPress={() => {}}
            />
          </Box>
        </Card>
      </Section>
    </ScrollView>
  );
}

// Helper Components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box style={{ gap: space[3] }}>
      <Text variant="title">{title}</Text>
      <Box style={{ gap: space[3] }}>{children}</Box>
    </Box>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <Box style={{ alignItems: "center", gap: space[1] }}>
      <Box
        style={{
          width: 60,
          height: 60,
          backgroundColor: color,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />
      <Text variant="cap" muted>
        {label}
      </Text>
    </Box>
  );
}

function SpacingExample({ size, label }: { size: number; label: string }) {
  return (
    <Box style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
      <Box
        style={{
          width: size,
          height: 24,
          backgroundColor: colors.primary,
          borderRadius: radius.sm,
        }}
      />
      <Text variant="sub" muted>
        {label}
      </Text>
    </Box>
  );
}
