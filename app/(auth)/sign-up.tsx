import { translateClerkError } from "@/lib/utils";
import { useAuth, useSignUp } from "@clerk/expo";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const SignUp = () => {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const posthog = usePostHog();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  // Validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Client-side validation
  const emailValid =
    emailAddress.length === 0 ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
  const passwordValid = password.length === 0 || password.length >= 8;
  const formValid =
    emailAddress.length > 0 && password.length >= 8 && emailValid;

  const handleSubmit = async () => {
    if (!formValid) return;

    try {
      const result = await signUp.password({
        emailAddress,
        password,
      });

      // Send verification email
      if (!result.error) {
        await signUp.verifications.sendEmailCode();
      }
    } catch (error: any) {
      posthog.capture("user_sign_up_failed", {
        error_message: error.errors?.[0]?.message || "Registration failed",
      });
    }
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({
      code,
    });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          posthog.identify(emailAddress, {
            $set: { email: emailAddress },
            $set_once: { sign_up_date: new Date().toISOString() },
          });
          posthog.capture("user_signed_up", { email: emailAddress });
        },
      });
    } else {
      console.error("Sign-up attempt not complete:", signUp);
    }
  };

  // Don't show anything if already signed in or sign-up is complete
  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  // Show verification screen if email needs verification
  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <SafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="auth-screen"
        >
          <ScrollView
            className="auth-scroll"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="auth-content">
              {/* Branding */}
              <View className="auth-brand-block">
                <View className="auth-logo-wrap">
                  <View className="auth-logo-mark">
                    <Text className="auth-logo-mark-text">BC</Text>
                  </View>
                  <View>
                    <Text className="auth-wordmark">Payno</Text>
                    <Text className="auth-wordmark-sub">CODEZEN</Text>
                  </View>
                </View>
                <Text className="auth-title">Verifica tu correo</Text>
                <Text className="auth-subtitle">
                  Hemos enviado un código de confirmación a {emailAddress}
                </Text>
              </View>

              {/* Verification Form */}
              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Código de Verificación</Text>
                    <TextInput
                      className="auth-input"
                      value={code}
                      placeholder="Ingresa el código de 6 dígitos"
                      placeholderTextColor="rgba(0, 0, 0, 0.4)"
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      maxLength={6}
                    />
                    {errors.fields.code && (
                      <Text className="auth-error">
                        {errors.fields.code.message}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    className={`auth-button ${(!code || fetchStatus === "fetching") && "auth-button-disabled"}`}
                    onPress={handleVerify}
                    disabled={!code || fetchStatus === "fetching"}
                  >
                    <Text className="auth-button-text">
                      {fetchStatus === "fetching"
                        ? "Verificando..."
                        : "Confirmar correo"}
                    </Text>
                  </Pressable>

                  <Pressable
                    className="auth-secondary-button"
                    onPress={() => signUp.verifications.sendEmailCode()}
                    disabled={fetchStatus === "fetching"}
                  >
                    <Text className="auth-secondary-button-text">
                      Reenviar código
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main sign-up form
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            {/* Branding */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">BC</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">Payno</Text>
                  <Text className="auth-wordmark-sub">CODEZEN</Text>
                </View>
              </View>
              <Text className="auth-title">Crea tu cuenta</Text>
              <Text className="auth-subtitle">
                Empieza a organizar tus recibos, créditos y servicios hoy mismo.
              </Text>
            </View>

            {/* Sign-Up Form */}
            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Correo electrónico</Text>
                  <TextInput
                    className={`auth-input ${emailTouched && !emailValid && "auth-input-error"}`}
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="nombre@ejemplo.com"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    onChangeText={setEmailAddress}
                    onBlur={() => setEmailTouched(true)}
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                  {emailTouched && !emailValid && (
                    <Text className="auth-error">
                      Ingresa un correo electrónico válido.
                    </Text>
                  )}
                  {errors.fields.emailAddress && (
                    <Text className="auth-error">
                      {translateClerkError(errors.fields.emailAddress)}
                    </Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Contraseña</Text>
                  <TextInput
                    className={`auth-input ${passwordTouched && !passwordValid && "auth-input-error"}`}
                    value={password}
                    placeholder="Crea una contraseña segura"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    secureTextEntry
                    onChangeText={setPassword}
                    onBlur={() => setPasswordTouched(true)}
                    autoComplete="password-new"
                  />
                  {passwordTouched && !passwordValid && (
                    <Text className="auth-error">
                      Debe tener al menos 8 caracteres.
                    </Text>
                  )}
                  {errors.fields.password && (
                    <Text className="auth-error">
                      {translateClerkError(errors.fields.password)}
                    </Text>
                  )}
                  {!passwordTouched && (
                    <Text className="auth-helper">Mínimo 8 caracteres.</Text>
                  )}
                </View>

                <Pressable
                  className={`auth-button ${(!formValid || fetchStatus === "fetching") && "auth-button-disabled"}`}
                  onPress={handleSubmit}
                  disabled={!formValid || fetchStatus === "fetching"}
                >
                  <Text className="auth-button-text">
                    {fetchStatus === "fetching" ? "Creando..." : "Crear cuenta"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Sign-In Link */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">¿Ya tienes una cuenta?</Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable
                  onPress={async () => {
                    await signUp.reset();
                  }}
                >
                  <Text className="auth-link">Iniciar sesión</Text>
                </Pressable>
              </Link>
            </View>

            {/* Required for Clerk's bot protection */}
            <View nativeID="clerk-captcha" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
