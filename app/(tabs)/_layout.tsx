import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      blurEffect="systemMaterial"
      iconColor={{
        default: "#8C9390",
        selected: "#00BE3C"
      }}
    >
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
      <NativeTabs.Trigger name="activity">
        <Label>Activity</Label>
        <Icon sf="clock.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.circle.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
