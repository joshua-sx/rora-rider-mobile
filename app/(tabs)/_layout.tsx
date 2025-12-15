import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  return (
    <NativeTabs blurEffect="systemMaterial">
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Label>Explore</Label>
        <Icon sf="paperplane.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="drivers">
        <Label>Drivers</Label>
        <Icon sf="car.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.circle.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
