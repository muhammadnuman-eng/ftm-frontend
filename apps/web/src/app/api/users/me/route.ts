import { getPayloadClient } from "@/lib/payload";
export async function GET(request: Request): Promise<Response> {
    try {
        const payload = await getPayloadClient();

        // Get current user from payload using the request headers
        const { user } = await payload.auth({ headers: request.headers });

        if (!user) {
            return Response.json({ user: null }, { status: 200 });
        }

        // Return user data (excluding sensitive fields)
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        };

        return Response.json({ user: userData }, { status: 200 });
    } catch (error) {
        console.error("Error fetching current user:", error);
        return Response.json({ user: null }, { status: 200 });
    }
}
