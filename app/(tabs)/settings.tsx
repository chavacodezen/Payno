import { useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View className="rounded-4xl bg-card border border-border p-6 shadow-sm">
        <Text className="mb-2 text-sm font-sans-semibold text-primary">
          Cuenta
        </Text>
        <Text className="text-2xl font-sans-bold text-primary">
          {user?.firstName ? `Hola, ${user.firstName}` : "Bienvenido"}
        </Text>
        {user?.primaryEmailAddress ? (
          <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
            {user.primaryEmailAddress.emailAddress}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => signOut()}
        className="mt-6 rounded-3xl bg-destructive px-5 py-4 items-center"
      >
        <Text className="text-base font-sans-semibold text-white">
          Cerrar sesión
        </Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
