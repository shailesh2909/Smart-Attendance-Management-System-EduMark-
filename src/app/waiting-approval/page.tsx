import Link from "next/link";
import { ROUTES, APP_CONFIG } from "@/utils/constants";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function WaitingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Account Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been created successfully!
          </p>
        </div>

        {/* Main Content */}
        <Card className="mt-8">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Registration Complete</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Thank you for registering with {APP_CONFIG.name}. Your account has been created and is now pending approval from the system administrator.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    What happens next?
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>An administrator will review your registration</li>
                      <li>You'll receive an email notification once approved</li>
                      <li>After approval, you can log in to access the system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This process typically takes 1-2 business days. If you have any questions or need immediate assistance, please contact the IT support team.
              </p>

              <div className="space-y-3">
                <Link href={ROUTES.LOGIN}>
                  <Button variant="primary" className="w-full">
                    Try to Login
                  </Button>
                </Link>
                
                <Link href={ROUTES.HOME}>
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gray-50 border-gray-200">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Email: support@pict.edu</p>
              <p>Phone: +91 20 2769 0062</p>
              <p>Office Hours: Mon-Fri, 9:00 AM - 5:00 PM</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}