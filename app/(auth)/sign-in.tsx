import { translateClerkError } from "@/lib/utils";
import { useSignIn } from "@clerk/expo";
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

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
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
  const passwordValid = password.length > 0;
  const formValid =
    emailAddress.length > 0 && password.length > 0 && emailValid;

  const handleSubmit = async () => {
    if (!formValid) return;

    try {
      await signIn.password({
        emailAddress,
        password,
      });

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              return;
            }

            posthog.identify(emailAddress, {
              $set: { email: emailAddress },
              $set_once: { first_sign_in_date: new Date().toISOString() },
            });
            posthog.capture("user_signed_in", { email: emailAddress });
          },
        });
      } else if (signIn.status === "needs_second_factor") {
        // Handle MFA if needed (not implemented in this basic flow)
        console.log("MFA required");
      } else if (signIn.status === "needs_client_trust") {
        // Send email code for client trust verification
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
        }
      }
    } catch (error: any) {
      posthog.capture("user_sign_in_failed", {
        error_message: error.errors?.[0]?.message || "Log In failed",
      });
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          // Track successful sign-in after verification
          posthog.identify(emailAddress, {
            $set: { email: emailAddress },
            $set_once: { first_sign_in_date: new Date().toISOString() },
          });
          posthog.capture("user_signed_in", { email: emailAddress });
        },
      });
    } else {
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  // Show verification screen if client trust is needed
  if (signIn.status === "needs_client_trust") {
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
                <Text className="auth-title">Verifica tu identidad</Text>
                <Text className="auth-subtitle">
                  Hemos enviado un código de seguridad a tu correo electrónico.
                </Text>
              </View>

              {/* Verification Form */}
              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Código de verificación</Text>
                    <TextInput
                      className="auth-input"
                      value={code}
                      placeholder="Código de 6 dígitos"
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
                        : "Verificar código"}
                    </Text>
                  </Pressable>

                  <Pressable
                    className="auth-secondary-button"
                    onPress={() => signIn.mfa.sendEmailCode()}
                    disabled={fetchStatus === "fetching"}
                  >
                    <Text className="auth-secondary-button-text">
                      Reenviar código
                    </Text>
                  </Pressable>

                  <Pressable
                    className="auth-secondary-button"
                    onPress={() => signIn.reset()}
                    disabled={fetchStatus === "fetching"}
                  >
                    <Text className="auth-secondary-button-text">
                      Volver al inicio
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

  // Main sign-in form
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
              <Text className="auth-title">Bienvenido</Text>
              <Text className="auth-subtitle">
                Inicia sesión para tomar el control de tus pagos.
              </Text>
            </View>

            {/* Sign-In Form */}
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
                      Por favor, ingresa un correo válido.
                    </Text>
                  )}
                  {errors.fields.identifier && (
                    <Text className="auth-error">
                      {translateClerkError(errors.fields.identifier)}
                    </Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Contraseña</Text>
                  <TextInput
                    className={`auth-input ${passwordTouched && !passwordValid && "auth-input-error"}`}
                    value={password}
                    placeholder="Tu clave de seguridad"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    secureTextEntry
                    onChangeText={setPassword}
                    onBlur={() => setPasswordTouched(true)}
                    autoComplete="password"
                  />
                  {passwordTouched && !passwordValid && (
                    <Text className="auth-error">
                      La contraseña es obligatoria.
                    </Text>
                  )}
                  {errors.fields.password && (
                    <Text className="auth-error">
                      {translateClerkError(errors.fields.password)}
                    </Text>
                  )}
                </View>

                <Pressable
                  className={`auth-button ${(!formValid || fetchStatus === "fetching") && "auth-button-disabled"}`}
                  onPress={handleSubmit}
                  disabled={!formValid || fetchStatus === "fetching"}
                >
                  <Text className="auth-button-text">
                    {fetchStatus === "fetching"
                      ? "Iniciando..."
                      : "Iniciar Sesión"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Sign-Up Link */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">¿Aún no tienes cuenta?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable
                  onPress={async () => {
                    await signIn.reset();
                  }}
                >
                  <Text className="auth-link">Regístrate aquí</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
