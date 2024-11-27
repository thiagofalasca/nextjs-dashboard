export default function RegistrationConfirmation() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-[540px] text-center">
        <div>
          <p className="text-2xl font-bold">Check Your Email</p>
        </div>
        <div>
          <p className="text-gray-600 mb-4">
            We've sent a confirmation link to your email address. Please check
            your inbox and click the link to activate your account.
          </p>
          <p className="text-sm text-gray-500">
            If you don't see the email, please check your spam folder.
          </p>
        </div>
      </div>
    </main>
  );
}
