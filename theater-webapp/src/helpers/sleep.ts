export async function Sleep(ms: number) {
	return await new Promise((resolve) => setTimeout(resolve, ms))
}