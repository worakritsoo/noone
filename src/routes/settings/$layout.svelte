<script lang="ts" context="module">
	export const prerender = true;
</script>

<section class="text-gray-600 body-font">
	<div class="container px-5 py-24 mx-auto">
		<div class="flex flex-col text-center w-full mb-20">
			<h1 class="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">ตั้งค่า</h1>
			<p class="lg:w-2/3 mx-auto leading-relaxed text-base">
				ตั้งค่าการใช้งาน การแจ้งเตือน และ ข้อมูลส่วนตัว
			</p>
		</div>
		<div class="flex flex-col text-center w-full mb-20">
			<div class="submenu">
				<a sveltekit:prefetch href="/settings/profile">ข้อมูลส่วนตัว</a>
				| <a sveltekit:prefetch href="/settings/notifications">แจ้งเตือน</a>
			</div>
			<slot />
		</div>
	</div>
</section>
